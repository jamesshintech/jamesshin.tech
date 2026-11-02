---
slug: 2026-w43-billing-controls-from-checklists-to-harnesses
title: "Billing Controls: From Checklists to Harnesses"
date: 2026-10-23
revised: 2026-11-02
type: essay
summary: "Agents are starting to touch money. They need the same controls SOX auditors test on the people who touch billing inputs, enforced at the tool boundary."
draft: false
week: 2026-W43
---

# Billing Controls: From Checklists to Harnesses

<div class="bluf">

**Bottom line.** Agents are moving from answering to executing. In billing, executing means touching money. Stripe's answer to agents paying for things was not a new framework. It scoped the credential: one business, one amount, one window, revocable, raw card never exposed.[^1] That is a preventive control moved into the token. The controls SOX auditors test over the humans who touch billing inputs are preventive and detective, and a failed control needs a corrective response. Agents need all three, at the tool boundary.

</div>

## 1. Where the controls go

Ben Thompson's reading of Stripe is that its product is an abstraction layer: a "platform for platforms" that absorbs the complexity of money movement so the businesses above it do not have to.[^2] His rule for infrastructure, written about content moderation and borrowed here as an analogy, is that responsibility belongs at the layer closest to the action, with the layers beneath neutral and procedural.[^3]

Agentic billing has the same stack. The agent above reasons. The ledger below records. The tool server between them is the layer closest to the action, so it is where the controls live. Stripe reached the same conclusion for payments: "trust can’t be inferred—it has to be explicitly granted, scoped, and enforced in code."[^1]

The inputs are what need controlling. The invoice is arithmetic on price, credit terms, partner feed, tax code, entity, currency, and order of application. In 13 years I have not seen a billing failure caused by the arithmetic.[^4]

## 2. The control boundary

Two terms carry the rest of this piece. A write's *class* says what it can break: 0, nothing billed; 1, a charge a customer sees; 2, history, balances or payouts. The *releaser* is the identity that approves a drafted write, and it is never the identity that drafted it, with one bounded exception, below.

An agent never touches a billing system directly. It calls a tool server. The server enforces authorization, runs a fixed query or write, validates the schema, and logs the call. The protocol (MCP) defines the boundary; the server is the control. An agent with a shell or raw SQL has no boundary.

<figure class="fig fig--boundary">
<ol class="fig-flow fig-flow--wide-row">
<li class="fig-node fig-node--plain"><strong>Agent</strong><br><code>principal: <span class="nb">svc-billing</span></code><br>scoped role, reviewed quarterly</li>
<li class="fig-node"><span class="fig-edge">MCP</span><strong>Tool server (the control)</strong><br>1. authorize caller and class<br>2. fixed query or write<br>3. validate schema<br>4. append to log: in, out, caller<br><code>reconcile_<wbr>source_<wbr>to_<wbr>subledger()</code><br><code>credit_issue(cust, amt, ccy, why)</code></li>
<li class="fig-group"><span class="fig-edge fig-edge--stacked">by class</span><ol class="fig-lanes">
<li class="fig-node fig-node--plain"><strong>Class 0: execute</strong><br>nothing billed can change</li>
<li class="fig-node"><strong>Class 1: draft</strong><br>staging store<br>a releaser, never the drafter<br>under limit: auto, capped, sampled</li>
<li class="fig-node fig-node--ink"><strong>Class 2: human only</strong><br>reconcile before post<br>kill switch armed</li>
</ol></li>
<li class="fig-node"><strong>Billing systems</strong><br>rating, invoicing, balances, ledger</li>
</ol>
<p class="fig-blocked"><strong>Blocked:</strong> no shell, no raw SQL, no direct API key. The agent has no path to billing systems except through the tool server.</p>
<figcaption>Diagram 1. Every agent action crosses the tool server. Class decides the lane. The dashed path does not exist.</figcaption>
</figure>

Writes are classed by what they can break. Class lives in the credential, not a document.

| Class | What it can break | Who executes | Example |
|---|---|---|---|
| 0 | Nothing billed | Agent | Catalog description, dashboard |
| 1 | A charge a customer sees | Agent drafts; a different identity releases | $40 goodwill credit; new SKU |
| 2 | History, balances, partner payouts, journal mapping | Human only; reconciliation before post | Change the order credits apply |

**Example, Class 1.** The agent calls `credit_issue(cust, 40, USD, reason)`. It lands in staging. A releaser, never the drafter, approves. Both identities are in the log. Under finance's approval limit (say $50), the agent releases itself. That breaks the drafter-releaser split, so it is a compensating control with its own bounds: a $5,000 daily cap and 1 in 20 sampled by a person each day. Above the limit, a human releases.

## 3. The SOX map: three control types, each with an agent analog

| Type | SOX control | Humans | Agents |
|---|---|---|---|
| Preventive | Access | Role, least privilege, quarterly review | Each agent is a principal with a role, reviewed quarterly; user-invoked agents get on-behalf-of tokens |
| Preventive | Segregation of duties | Preparer is not approver | Drafter identity is not releaser identity, enforced by the server; under the limit, capped and sampled instead |
| Preventive | Change management | Test, approve, deploy by different people | Every tool, prompt, or model version change runs the eval gate, then approval, then segregated deploy |
| Preventive | Application controls | Edit checks | Fixed query, schema, authorization. Proves shape, not value |
| Detective | Information produced by entity | Prove the report is complete and accurate | Every tool output carries row counts and control totals before anyone relies on it |
| Detective | Reconciliation | Period-end reconciliation | Daily reconciliation over the full population; exceptions still go to a person |
| Detective | Evidence | Approvals, reviewer identity, retention | Append-only log of every call: inputs, outputs, caller, releaser |
| Corrective | Control failure | Incident, then remediation | Kill switch halts the path; rollback; tool returns to human release until root cause is fixed |

## 4. The change gate

A change is any new tool, prompt, or model version. It passes two tests before approval.

- **Golden set.** Known events in; expected invoice, credit, tax, and journal lines out. Tests the deterministic tools. Owned by the function it protects (tax owns tax cases), approved outside engineering, reconciled to the live catalog so a SKU with no case is a finding.
- **Trajectory eval.** Which tool, which arguments, what order. Each case runs 5 times. Pass: same ledger end-state every run, no call outside the allowed set.

Then a shadow run: replay yesterday's events against balance state as of each event, with idempotency keys, writes isolated, diffed against what production posted.

<figure class="fig fig--gate">
<ol class="fig-flow fig-flow--wide-row">
<li class="fig-node fig-node--plain"><strong>Change</strong><br>tool, prompt, or model version</li>
<li class="fig-node"><strong>Eval gate</strong><br>golden set: tools<br>trajectory: choices, k=5<br>owner outside eng<br>catalog reconciled<br><span class="fig-fail">fail: blocked, back to author</span></li>
<li class="fig-node"><strong>Approve</strong><br>not the author</li>
<li class="fig-node"><strong>Deploy</strong><br>not the author</li>
<li class="fig-node"><strong>Shadow run</strong><br>state as of event<br>idempotent, isolated<br>diff vs production</li>
<li class="fig-node fig-node--ink"><strong>Release</strong><br>per class</li>
</ol>
<p class="fig-rail fig-node fig-node--plain"><strong>Append-only log</strong><br>change id, version hash, eval result, approver, deployer, shadow diff</p>
<p class="fig-rail fig-node"><strong>Auditor</strong><br>samples change events from the log and tests who can edit the golden set, the harness, and the kill switch</p>
<figcaption>Diagram 2. One passing run is the control operating once. The audit is the row underneath.</figcaption>
</figure>

A passing run is the control operating once. It is not the audit. The auditor samples change events, checks each had its eval, approval, and segregated deploy, and tests who could edit the golden set, the harness, and the kill switch.

## 5. What it costs

- One to two days on every Class 1 and 2 request.
- No promotion invented Friday for Monday.
- A longer outage over a wrong invoice.
- FX drift between grant and consumption absorbed by the company, reported monthly.
- Someone owns every golden set.
- Every miss logged: date, cause, exposure, fix. No penalty for reporting.

## 6. Mapping to the billing program

| Program | Mechanism |
|---|---|
| Intake | One front door. Class assigned on arrival. 10 classifications a month re-performed independently; disagreement rate published |
| Launch readiness | Pricing, metering, invoicing-and-tax, and reporting tools each pass their golden set in the billing entity. Reused tools inherit |
| Promotions and credits | Expiry, application order, currency, refundability, journal entry are tool parameters set before launch. Balance by surface reconciles daily |
| Charge pipeline change | Class 1: gate, shadow, rollback. Class 2: adds reconciliation exit, finance sign-off, kill switch |
| Payments and FX | Calendar-driven. Grant-date rate stored with each credit |

Release mode changes with evidence; class never does. Two clean quarters let finance move a Class 1 tool to capped auto-release, as a documented design change. One failed eval reverses it.

[^1]: Stripe, ["Introducing our agentic commerce solutions,"](https://stripe.com/blog/introducing-our-agentic-commerce-solutions) 7 Oct 2025: Shared Payment Tokens "can be scoped to a specific business, limited by time or amount, revoked at any time"; "underlying credentials are not exposed." Expanded to Visa and Mastercard agentic network tokens, Mar 2026 ([American Banker](https://www.americanbanker.com/payments/news/stripe-advances-security-for-agentic-commerce)).

[^2]: Ben Thompson, ["Stripe: Platform of Platforms,"](https://stratechery.com/2020/stripe-platform-of-platforms/) Stratechery, 3 Dec 2020.

[^3]: Ben Thompson, ["Moderation in Infrastructure,"](https://stratechery.com/2021/moderation-in-infrastructure/) Stratechery, 16 Mar 2021: "the further down the stack, the more legality should be the sole criteria"; the rule for everything above it is the post's heading, "Your Layer = Your Responsibility."

[^4]: Sample: enterprise order-to-cash, one-time and recurring charges (Dynamics, NetSuite, SAP S/4HANA, Oracle, in-house billing platforms). Not high-volume self-serve; section 2's approval limit exists for that case. Control terms follow [PCAOB AS 2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201) and [COSO 2013](https://www.coso.org/guidance-on-ic).

