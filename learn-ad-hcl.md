# Learn the .ad.hcl language

This guide teaches you to write and read `.ad.hcl` files.
An `.ad.hcl` file describes a software design with the method of Axiomatic Design (AD).
You write what the software must do, how the design does it, and how the parts affect each other.
The `adhcl` tool reads the file, builds the design matrices, and reports gaps and errors.

You build one small model from an empty file to a complete design.
Each lesson adds one idea, and you run the tool after each step.
Every report in this guide comes from real runs of `adhcl` on the example files.

## What you can do at the end

After the guide, you can do these tasks without help:

1. Explain the terms need, functional requirement (FR), design parameter (DP), and process variable (PV).
2. Write a design root, needs, FRs with acceptance criteria, and DPs.
3. Write influences with the correct effect: `material`, `none`, or `unknown`.
4. Predict if a design is uncoupled, decoupled, or coupled before you run the tool.
5. Read an `adhcl` report and fix each error that it names.
6. Break an FR into child FRs, and add modules and scenarios for the architecture profile.
7. Split a model into files and add a project manifest with attachments.

## Before you start

You need three things:

1. Basic experience with a text editor and a terminal.
2. Go 1.25 or later, to build the `adhcl` tool.
3. About three hours, in several short sessions.

You do not need to know HCL or Axiomatic Design before you start.
If you know Terraform, the syntax is familiar, but the rules are stricter.

## How this guide teaches

The guide uses methods from learning research.
These methods feel harder than reading, and that extra effort is the part that makes you remember.
Use the guide in this way:

1. Type each example. Do not copy and paste it. Typing makes you notice each field.
2. When the guide asks you to predict, write your prediction down before you run the tool.
3. Answer each "Test yourself" question from memory. Then open the answer.
4. When a question is hard, do not reread the lesson first. Try to answer, then look back.
5. Do the review questions again one day later and one week later.

A wrong prediction is useful.
It shows you the exact idea that you must learn next.

## Set up the tool

The `adhcl` tool is in the `adhcl` repository of the `axiomatic-design-hcl` organization.
It needs Go 1.25 or later.

1. Clone the repository: `git clone https://github.com/axiomatic-design-hcl/adhcl.git`
2. Go into the folder: `cd adhcl`
3. Build the tool: `make build`. The binary goes to `bin/adhcl`.
4. Add the `bin` folder to your `PATH`, or call the tool with its full path.
5. Run `adhcl version`. A local build prints `adhcl dev`.

Make a new empty folder for your work, for example `~/learn-adhcl`.
All the files in this guide go into that folder.

The tool has one main command:

```sh
adhcl validate [--profile source|architecture] PATH
```

`PATH` is one `.ad.hcl` file, a folder of `.ad.hcl` files, or a `.ad.project.hcl` manifest.
The `source` profile is the default.
The tool writes a text report to the terminal.
The exit code is 0 when the report has no errors, 1 when it has errors, and 2 when the command line is wrong.

---

## Lesson 1: The idea behind Axiomatic Design

Axiomatic Design describes a design as a set of mappings between domains.
A domain is one kind of description of the same product.
Each mapping goes from "what" to "how":

| Domain | Question | Example for a notes app |
|---|---|---|
| Need | Why does the user want it? | Write down an idea fast and find it again later. |
| Functional requirement (FR) | What outcome must the software give? | Save a new note. |
| Design parameter (DP) | Which part of the design controls that outcome? | A table that stores one row for each note. |
| Process variable (PV) | Which code or resource makes the DP real? | The `notes` table in a database. |

An FR states an outcome.
A DP controls an outcome.
A PV realizes a DP.

### The design matrix

The design matrix shows which DP affects which FR.
It has one row for each FR and one column for each DP.
Each cell has one of three values:

| Value | Meaning |
|---|---|
| `X` | The DP has a material effect on the FR. A change to the DP can make the FR fail its target. |
| `0` | The DP has no material effect on the FR. The author gives a reason. |
| `?` | Nobody knows yet. |

The `?` value is important in this language.
An empty cell is never a silent zero.
If you do not state a fact, the tool treats it as unknown.

### Three kinds of design

The Independence Axiom says this: keep the FRs independent of each other.
In a good design, you can adjust each FR with its own DP and not break the other FRs.
The matrix tells you how well the design does this:

| Kind | Matrix shape | What it means for you |
|---|---|---|
| Uncoupled | Only the diagonal has `X`. | Each DP changes only its own FR. You can set the DPs in any order. |
| Decoupled | The `X` cells form a triangle. | You can set the DPs in one fixed order and not go back. |
| Coupled | No order makes a triangle. | A change to one DP forces changes to others, maybe again and again. |

Here are three small matrices, with FRs as rows and DPs as columns:

```text
Uncoupled         Decoupled         Coupled
     DP1 DP2           DP1 DP2           DP1 DP2
FR1   X   0       FR1   X   0       FR1   X   X
FR2   0   X       FR2   X   X       FR2   X   X
```

In the decoupled matrix, DP1 affects FR1 and FR2.
So you set DP1 first, then set DP2 to fix FR2.
The tool calls this the design order.

A matrix shows a structure, not a proof.
An `X` or a `0` is a claim by the author.
The tool reports when a claim has no reviewed support.

### Test yourself

Answer each question from memory before you open the answer.

1. What is the difference between an FR and a DP?
2. In this language, what does a cell that nobody wrote mean?
3. A matrix has `X` in cells (FR1, DP1), (FR2, DP2), and (FR1, DP2). Which kind of design is it, and which DP do you set first?

<details>
<summary>Answers</summary>

1. An FR states an outcome that the software must give. A DP is the part of the design that controls that outcome.
2. It means unknown (`?`). It is not a zero.
3. It is decoupled. DP2 affects FR1 and FR2, so you set DP2 first, then DP1. The order is DP2, DP1.

</details>

---

## Lesson 2: How an .ad.hcl file looks

An `.ad.hcl` file uses the native syntax of HCL.
HCL is the configuration language that Terraform uses.
The file is a list of blocks.

```hcl
fr "save_note" {
  need = [need.keep_ideas]
  statement = "Save a new note."
}
```

This example has these parts:

1. `fr` is the block type. Here it is a functional requirement.
2. `"save_note"` is the label. It is the name of the block.
3. `need` and `statement` are attributes. Each one has a name, an equals sign, and a value.
4. `"Save a new note."` is a string value.
5. `need.keep_ideas` is a reference. It points to the block `need "keep_ideas"`.
6. `[ ... ]` is a list.

### Rules that HCL alone does not have

The language is stricter than Terraform.
These rules apply to every file:

1. A label uses lower case letters, digits, and single underscores. It starts with a letter. `save_note` is correct. `SaveNote` and `save__note` are errors.
2. A reference has the form `TYPE.LABEL`, without quotes. `fr.save_note` is a reference. `"fr.save_note"` is only a string, and the tool rejects it in a reference field.
3. A nested block has a longer reference. A criterion `save_time` inside `fr "save_note"` is `fr.save_note.criterion.save_time`.
4. You cannot calculate. Arithmetic, function calls, conditions, and `${...}` templates are errors. Write each value as a literal.
5. Unknown blocks, unknown fields, and `null` are errors. The tool does not ignore them.
6. Each label is unique inside its block type. `fr.search` and `dp.search` can both exist.
7. Comments use `#`, as in HCL.

To keep the source IDs of a paper or a team, use the `alias` field, for example `alias = "FR1"`.
Do not put those IDs in the label.

### Test yourself

This block has three errors. Find them before you open the answer.

```hcl
dp "WordIndex" {
  controls = ["fr.find_notes"]
  responsibility = "Map each word to its notes."
  decision = "selected"
  cache_size = 100 * 1024
}
```

<details>
<summary>Answers</summary>

1. The label `WordIndex` has upper case letters. Use `word_index`.
2. `"fr.find_notes"` is a string. Use the reference `fr.find_notes` without quotes.
3. `cache_size` is not a DP field, and `100 * 1024` is arithmetic. Both are errors. Put that kind of detail in `responsibility` as text.

</details>

---

## Lesson 3: Your first model

In this lesson you write the start of a notes app.
The app saves short text notes and finds them by a word.
You write three kinds of blocks:

| Block | Purpose | Required fields |
|---|---|---|
| `design` | The root of the model. Each model has exactly one. | `boundary` |
| `need` | Why a user wants the software. | `statement` |
| `fr` | An outcome that the software must give. | `statement`. A top-level FR also needs `need`. |

The `boundary` says what is in the design and what is outside it.
The `origin` field says where a fact comes from: `user`, `source`, `proposed`, or `inferred`.
Here the need is your own proposal, so it uses `origin = "proposed"`.

Make a file `notes.ad.hcl` and type this text:

```hcl
design "notes" {
  boundary = "Save short text notes and find them by a word. User accounts and sync are outside the boundary."
}

need "keep_ideas" {
  statement = "Write down an idea fast and find it again later."
  origin = "proposed"
}

fr "save_note" {
  need = [need.keep_ideas]
  statement = "Save a new note."
}

fr "find_notes" {
  need = [need.keep_ideas]
  statement = "Return the notes that contain a search word."
}
```

### Predict, then run

The model has two FRs and no DPs.
Before you run the tool, write down your answers to these two questions:

1. Do you expect an error or only warnings?
2. Which problem do you expect the tool to name first?

Now run the tool:

```sh
adhcl validate notes.ad.hcl
```

The findings part of the report is this:

```text
Findings
- error uncontrolled_requirement on design.notes: Requirement fr.save_note has no distinct control in scope design.notes.
- error uncontrolled_requirement on design.notes: Requirement fr.find_notes has no distinct control in scope design.notes.
- error uncontrolled_requirement on master: Requirement fr.save_note has no distinct control in scope master.
- error uncontrolled_requirement on master: Requirement fr.find_notes has no distinct control in scope master.
- warning incomplete_criterion on fr.save_note at notes.ad.hcl:10:1: Requirement fr.save_note has no applicable criterion with a metric, operator, and value, so no operational predicate checks it.
- warning missing_leaf_scenario on fr.save_note at notes.ad.hcl:10:1: Leaf requirement fr.save_note has no applicable scenario with steps that verifies all of its applicable criteria.
- warning incomplete_criterion on fr.find_notes at notes.ad.hcl:15:1: Requirement fr.find_notes has no applicable criterion with a metric, operator, and value, so no operational predicate checks it.
- warning missing_leaf_scenario on fr.find_notes at notes.ad.hcl:15:1: Leaf requirement fr.find_notes has no applicable scenario with steps that verifies all of its applicable criteria.
```

The exit code is 1, because the report has errors.

### Read the findings

Each finding has a severity, a code, a subject, a location, and a message.
The code is stable, so you can look it up in the [diagnostic contract](https://github.com/axiomatic-design-hcl/spec/blob/main/docs/diagnostics.md).

An error makes the run fail.
A warning records a gap, but the run can still pass.

The `uncontrolled_requirement` error says that no DP controls each FR.
Every FR needs its own DP.
You add the DPs in Lesson 5.

The tool reports each problem twice: for the scope `design.notes` and for the scope `master`.
A scope is one group of sibling FRs and DPs.
The `master` scope is the matrix over all leaf FRs and leaf DPs of the whole design.
In a model with one level, the two scopes are the same.

The warnings name two more gaps.
The FRs have no acceptance criteria, and no scenario tests them.
You fix the criteria in the next lesson and the scenarios in Lesson 12.

---

## Lesson 4: Acceptance criteria

An FR without a target is only a wish.
A `criterion` block inside an `fr` block states when the FR succeeds.
An operational criterion has three fields that go together:

| Field | Meaning | Example |
|---|---|---|
| `metric` | What you measure. | `"milliseconds from the save request to the reply"` |
| `op` | How you compare. One of `<=`, `<`, `>=`, `>`, `==`, `in`. | `"<="` |
| `value` | The target. Its type depends on `op`. | `200` |

You can add `unit`, for example `unit = "ms"`.
The `origin` of a criterion is `user`, `proposed`, or `source`.
Use `proposed` when the target is your own suggestion.

For `in`, the value is a list of allowed values, or a range such as `{ min = 1, max = 10 }`.
The list `[1, 10]` means only 1 or 10, not the numbers between them.

If you do not know the number yet, write a `statement` with the condition in words.
The tool then gives an `incomplete_criterion` warning under the `source` profile.
Do not invent a number only to remove the warning.
A warning that tells the truth is better than a false target.

### Worked example

Change the `save_note` block in `notes.ad.hcl` to this:

```hcl
fr "save_note" {
  need = [need.keep_ideas]
  statement = "Save a new note."
  criterion "save_time" {
    metric = "milliseconds from the save request to the reply"
    op = "<="
    value = 200
    unit = "ms"
    origin = "proposed"
  }
}
```

### Your turn

Write a criterion `complete_results` for `find_notes`.
The target: every saved note that contains the search word appears in the result.
Write it yourself first. Then compare with the answer.

<details>
<summary>One possible answer</summary>

```hcl
fr "find_notes" {
  need = [need.keep_ideas]
  statement = "Return the notes that contain a search word."
  criterion "complete_results" {
    metric = "share of saved notes that contain the word and appear in the result"
    op = "=="
    value = 1
    origin = "proposed"
  }
}
```

Your metric text can be different. The important parts are a measurable metric, an operator, and a value. Use this version for the rest of the guide, so that your reports match the guide.

</details>

---

## Lesson 5: Design parameters

A `dp` block names the part of the design that controls an FR.
It has three required fields:

| Field | Meaning |
|---|---|
| `controls` | A list of the FRs that this DP is meant to control. |
| `responsibility` | What this part does, in words. |
| `decision` | The state of the choice: `proposed`, `selected`, `rejected`, or `superseded`. |

Only DPs with `decision = "selected"` are part of the design that the tool assesses by default.
A `proposed` or `rejected` DP stays in the file as a record of an option.
So the file keeps the history of your choices.

The `decision` field is a design decision.
It does not say that the code exists.
The tool finds the implementation status from other facts, not from this field.

### Add the DPs

Add these blocks to the end of `notes.ad.hcl`:

```hcl
dp "note_store" {
  controls = [fr.save_note]
  responsibility = "Write each note as one row in a local table and reply after the write."
  decision = "selected"
}

dp "word_index" {
  controls = [fr.find_notes]
  responsibility = "Keep a map from each word to the notes that contain it."
  decision = "selected"
}
```

A `controls` link is a proposed pairing.
It does not prove that the DP really changes the FR.
For that, you write an influence.

### Add the diagonal influences

An `influence` block states the effect of one or more DPs on one FR.
It has no label.
Add these two blocks:

```hcl
influence {
  from = [dp.note_store]
  to = fr.save_note
  effect = "material"
  mechanism = "The write path sets how long a save takes."
}

influence {
  from = [dp.word_index]
  to = fr.find_notes
  effect = "material"
  mechanism = "The index decides which notes a search returns."
}
```

These two influences fill the diagonal of the matrix.

### Predict, then run

The model now has two FRs, two DPs, and the two diagonal effects.
Write down your answer: is the design uncoupled?
Then run `adhcl validate notes.ad.hcl`.

These are the first findings and the scope part of the report:

```text
Findings
- warning unresolved_influence on design.notes: Scope design.notes has influence cells that are not fully known, so its classification is unresolved.
- warning unresolved_influence on master: Scope master has influence cells that are not fully known, so its classification is unresolved.
...
Scopes
- Scope design.notes: unresolved.
  Support: unresolved (structural classification alone is not support).
  Pairing: fr.find_notes with dp.word_index, fr.save_note with dp.note_store
  Order: none
```

The errors are gone, so the exit code is 0.
But the classification is `unresolved`, not `uncoupled`.
The two off-diagonal cells are unknown, because you did not write them:

```text
             note_store   word_index
save_note        X            ?
find_notes       ?            X
```

A diagonal that you wrote is not a diagonal matrix.
The tool does not guess zeros.
You must state the other cells too.

---

## Lesson 6: Influences in detail

Every influence has an `effect`.
Each effect value has its own rule:

| `effect` | Matrix cell | Required field |
|---|---|---|
| `material` | `X` | `mechanism`: how the DP changes the FR. |
| `none` | `0` | `because`: why the DP cannot change the FR. |
| `unknown` | `?` | No extra field. Use it to record an open question. |

A material effect means that a change to the DP can make the FR fail its criterion.
A function call alone is not a material effect.
Ask this question: if I change this DP, can this FR miss its target?

If you add a mechanism that no source states, add `mechanism_source = "inferred"`.
This marks the mechanism as your own reasoning.

### Fill in the matrix

Think about the notes app.
The index reads the words from the stored rows.
The save sends its reply before the index updates.

Before you read on, write the two missing cells as `X` or `0`, with one reason for each.

<details>
<summary>Answer</summary>

`note_store` to `find_notes` is `X`. The index reads the stored rows, so a change to the row format changes what the index sees.

`word_index` to `save_note` is `0`. The save replies before the index updates, so the index cannot change the save time.

</details>

Add the two influences to `notes.ad.hcl`:

```hcl
influence {
  from = [dp.note_store]
  to = fr.find_notes
  effect = "material"
  mechanism = "The index reads words from the stored rows. A change to the row format changes which words the index sees."
}

influence {
  from = [dp.word_index]
  to = fr.save_note
  effect = "none"
  because = "The index updates after the save reply is sent, so it cannot change the save time."
}
```

The matrix is now complete:

```text
             note_store   word_index
save_note        X            0
find_notes       X            X
```

### Predict, then run

Write down the classification and the design order that you expect.
Then run the tool. The scope part of the report is this:

```text
Scopes
- Scope design.notes: decoupled.
  Support: unresolved (structural classification alone is not support).
  Pairing: fr.find_notes with dp.word_index, fr.save_note with dp.note_store
  Order: dp.note_store, dp.word_index
```

The design is decoupled.
Decide `note_store` first, because it affects both FRs.
Then tune `word_index` to make `find_notes` meet its target.
If you change the row format later, you must test `find_notes` again.

### A default for the other cells

A large matrix has many zero cells.
A `cells` block gives one default for all unlisted cells in one scope:

```hcl
cells "top_level" {
  scope = design.notes
  unlisted = "none"
  because = "The index updates after the save reply is sent. No other pair has an effect."
}
```

`unlisted` is `none` or `unknown`.
A `none` default needs a `because`.
The default also fills diagonal cells that have no influence block.
So always write each diagonal influence first, or the tool reports that a DP has no effect on its own FR.

### Two facts that disagree

The tool keeps every influence that you write.
It does not let a later block replace an earlier one.
If one block says `material` and another says `none` for the same DP and FR, the tool reports `conflicting_influence` as an error.
Remove one of the two claims, or limit each claim to a different context with `under`.

---

## Lesson 7: Read the whole report

Run `adhcl validate notes.ad.hcl` again and read the full report.
It has five parts in this order:

1. The header: the input, tool version, contract, profile, candidate, context, and workload.
2. Findings: each error and warning.
3. Scopes: the classification, pairing, order, and cycles of each sibling set and of the master matrix.
4. Owners: the results of attachments. A file without a manifest has none.
5. Summary: the counts, the status of each stage, and the open causes.

Your report now has `support_gap` warnings, one for each influence.
For example:

```text
- warning support_gap on notes.ad.hcl:45-50 at notes.ad.hcl:45:1: The claimed influence from dp.note_store to fr.save_note has no reviewed support.
```

An influence is a claim.
The tool accepts the claim for the structure, but it says that nobody reviewed it.
That is why each scope says `Support: unresolved`.
The `support_gap` warning stays a warning in both profiles.

The last line of the report is the most important line:

```text
Exit code 0 means that validation completed under the profile, not that the design is independent or implemented.
```

Exit code 0 means that the model is well formed and has no error findings.
It does not prove that the design is good, that the claims are true, or that code exists.

### Test yourself

1. Which effect value needs `because`, and which needs `mechanism`?
2. You have the diagonal and nothing else. Why is the design not uncoupled?
3. What does exit code 0 prove, and what does it not prove?

<details>
<summary>Answers</summary>

1. `none` needs `because`. `material` needs `mechanism`.
2. The off-diagonal cells are unknown, not zero. The tool reports `unresolved` until you state them.
3. It proves that the run found no error under the chosen profile. It does not prove independence, true claims, or an implementation.

</details>

---

## Lesson 8: Learn from errors

Experts read error messages fast because they saw many of them.
In this lesson you make errors on purpose.
For each change, start from your working `notes.ad.hcl`.
Make the change, predict the code, then run the tool.
Undo the change before the next one.

| No. | Change |
|---|---|
| 1 | In `dp "note_store"`, write `controls = ["fr.save_note"]`. |
| 2 | In the `none` influence, delete the `because` line. |
| 3 | In the influence to `find_notes` from `word_index`, delete the `mechanism` line. |
| 4 | Rename `fr "find_notes"` to `fr "FindNotes"`. |
| 5 | In the `none` influence, write `from = [dp.wordindex]`. |
| 6 | In the criterion `save_time`, write `value = 100 + 100`. |

Write your six predictions down. Then open the answers.

<details>
<summary>Answers from real runs</summary>

1. `invalid_structure`: "controls each item must be a reference such as kind.label".
2. `invalid_structure`: "a none influence needs a because reason".
3. `invalid_structure`: "a material influence needs a mechanism".
4. `invalid_structure`: "the label must use lower case letters, digits, and single underscores, and start with a letter".
5. `invalid_reference`: "dp.wordindex does not name a declared block. This field needs a dp."
6. `invalid_syntax`: "This expression form is not allowed." The tool also reports `invalid_structure`, because the value is not a number.

Each error stops the run with exit code 1. The tool does not guess a fix. It does not turn a wrong reference into a string, and it does not compute the sum.

</details>

---

## Lesson 9: Coupled designs

Now change one design choice.
Suppose that the save waits for the index update before it replies.
Then a slow index makes a slow save.

Replace the `none` influence with this block:

```hcl
influence {
  from = [dp.word_index]
  to = fr.save_note
  effect = "material"
  mechanism = "The save waits for the index update before it replies, so a slow index makes a slow save."
}
```

Draw the matrix and predict the classification before you run the tool.

<details>
<summary>Answer</summary>

```text
             note_store   word_index
save_note        X            X
find_notes       X            X
```

No order of the DPs gives a triangle, so the design is coupled.

</details>

The report shows the cycle:

```text
- Scope design.notes: coupled.
  Support: unresolved (structural classification alone is not support).
  Pairing: fr.find_notes with dp.word_index, fr.save_note with dp.note_store
  Order: none
  Cycle: dp.note_store, dp.word_index
```

It also gives this warning:

```text
- warning incomplete_feedback_contract on design.notes at notes.ad.hcl:33:1: Scope design.notes has a feedback cycle without a complete coupling record, so its iteration bound, convergence, stopping rule, or failure behavior is missing.
```

A coupled design is valid input.
The tool does not call it an error.
But it asks you how the loop ends.

### Two ways forward

The better way is to change the design.
Go back to the version where the index updates after the reply.
That removes the `X` and makes the design decoupled again.

If you must keep the coupling, record it with a `coupling` block:

```hcl
coupling "save_waits_for_index" {
  scope = design.notes
  affects = [dp.note_store, dp.word_index, fr.save_note, fr.find_notes]
  reason = "The save waits for the index update, and the index reads the saved rows."
  iteration_bound = 3
  convergence = "Each pass indexes only the rows that changed, so the work gets smaller."
  stopping = "Stop when a pass finds no changed rows."
  failure_behavior = "After three passes, reply to the save and mark the index as stale."
}
```

The `affects` list must contain every DP in the cycle and the FR of each of those DPs.
With this block, the `incomplete_feedback_contract` warning goes away.
The design stays coupled.
A coupling record explains the coupling, but it does not remove it.

Before you continue, go back to the decoupled version.
Restore the `none` influence and delete the `coupling` block.

---

## Lesson 10: Tests with expect

An `expect` block is a test for the matrix.
You state the classification and the design order that you expect.
The tool fails the run if the result is different.

Add this block to `notes.ad.hcl`:

```hcl
expect "top_level_order" {
  scope = design.notes
  classification = "decoupled"
  order = [dp.note_store, dp.word_index]
}
```

The run passes, because the result is decoupled with that order.
An `expect` block is a test, not a fact.
It never fills in a missing cell.

### Make the test fail

Try two changes, one at a time, and predict the message each time.

1. Change the classification to `"uncoupled"`.
2. Change the order to `[dp.word_index, dp.note_store]`.

<details>
<summary>Answers from real runs</summary>

1. `failed_expectation`: "Expectation expect.top_level_order does not hold: scope design.notes is decoupled, not uncoupled."
2. `failed_expectation`: "Expectation expect.top_level_order does not hold: its order places dp.word_index before dp.note_store, but dp.note_store must come first because it materially affects fr.find_notes."

</details>

Undo both changes before you continue.
Keep `expect` blocks in your model.
When somebody adds an influence later, the test shows if the structure changed.

---

## Lesson 11: Break an FR down

A large FR needs more detail.
Axiomatic Design adds detail by zigzagging.
You choose a DP, then you ask which smaller FRs that DP must meet.
Those child FRs live inside the DP.

A child FR uses `parent = dp.x` in place of `need`.
The DP that controls a child FR has no parent field.
The tool finds its place from the FRs in its `controls` list.

In this lesson, you break `dp.word_index` into two parts: split the text into words, and look up a word.

### Add the children

Add this text to `notes.ad.hcl`:

```hcl
fr "split_words" {
  parent = dp.word_index
  statement = "Split the text of a note into words."
}

fr "look_up_word" {
  parent = dp.word_index
  statement = "Return the notes for one word."
}

dp "word_splitter" {
  controls = [fr.split_words]
  responsibility = "Split text at spaces and punctuation and make each word lower case."
  decision = "selected"
}

dp "word_map" {
  controls = [fr.look_up_word]
  responsibility = "Keep a hash map from each word to a list of note IDs."
  decision = "selected"
}

influence {
  from = [dp.word_splitter]
  to = fr.look_up_word
  effect = "material"
  mechanism = "The map keys are the words that the splitter makes. A different split gives different keys."
}

cells "index_parts" {
  scope = dp.word_index
  unlisted = "none"
  because = "The map does not change how text is split."
}
```

The new scope `dp.word_index` holds the two child FRs and their DPs.
It has its own matrix.

### Predict, then run

Something is missing.
Look at the `cells` block and the influences, and find the problem before you run the tool.

<details>
<summary>Answer</summary>

The diagonal influences are missing. The `cells` default sets every unlisted cell to `none`, and that includes the diagonal. The tool reports `ineffective_control` for both child DPs, once in the scope `dp.word_index` and once in the `master` scope:

```text
- error ineffective_control on dp.word_index: Design parameter dp.word_splitter has no material effect on its paired requirement fr.split_words in scope dp.word_index.
- error ineffective_control on dp.word_index: Design parameter dp.word_map has no material effect on its paired requirement fr.look_up_word in scope dp.word_index.
```

</details>

Add the two diagonal influences:

```hcl
influence {
  from = [dp.word_splitter]
  to = fr.split_words
  effect = "material"
  mechanism = "The split rule decides which words come out of a text."
}

influence {
  from = [dp.word_map]
  to = fr.look_up_word
  effect = "material"
  mechanism = "The map decides which note IDs a word returns."
}
```

Now the scope `dp.word_index` is decoupled with the order `dp.word_splitter, dp.word_map`.
But the `master` scope is still `unresolved`.

### The master matrix crosses branches

The master matrix has the leaf FRs as rows and the leaf DPs as columns.
Here the leaves are `save_note`, `split_words`, and `look_up_word`.
The `cells` block covers only one sibling set.
It does not cover cells between `note_store` and the new children.

Effects between branches are real.
Shared state, shared resources, and failures can join two branches.
So the tool asks you to state them.
Add these influences:

```hcl
influence {
  from = [dp.note_store]
  to = fr.split_words
  effect = "material"
  mechanism = "The splitter reads the text from the stored rows. A change to the row format changes the text it gets."
}

influence {
  from = [dp.note_store]
  to = fr.look_up_word
  effect = "none"
  because = "The map holds only words and note IDs that the splitter gives it."
}

influence {
  from = [dp.word_splitter, dp.word_map]
  to = fr.save_note
  effect = "none"
  because = "The index parts run after the save reply is sent."
}
```

The last block has two DPs in `from`.
The tool reads it as two separate claims with the same reason.

Run the tool again. The master scope is now decoupled:

```text
- Scope master: decoupled.
  Support: unresolved (structural classification alone is not support).
  Pairing: fr.look_up_word with dp.word_map, fr.save_note with dp.note_store, fr.split_words with dp.word_splitter
  Order: dp.note_store, dp.word_splitter, dp.word_map
```

Two `unresolved_refinement` warnings stay.
The material effects on the parent `find_notes` describe the parent outcome as a whole.
The tool does not copy a parent `X` down to the children.
Each parent effect is an open question about which child cells carry it.
The warning reminds you of that question.

Put each influence that crosses branches in the file of the nearest common parent.
You learn about files in Lesson 14.

The rest of this guide uses the one-level model from Lesson 10.
Save this version as `notes-zigzag.ad.hcl`, and restore `notes.ad.hcl` to the Lesson 10 state.

---

## Lesson 12: From design to code

So far, the model says what the design does.
Now you connect the design to the code with modules and scenarios.
The `architecture` profile requires these links.

### Predict, then run

Run the tool with the stricter profile:

```sh
adhcl validate --profile architecture notes.ad.hcl
```

Before you run it, predict which warning codes from Lesson 3 now become errors.

<details>
<summary>Answer</summary>

`missing_leaf_scenario` and `incomplete_module_contract` become errors. The `architecture` profile makes eight gap codes into errors, for example `incomplete_criterion` and `unresolved_influence`. The `support_gap` code stays a warning in both profiles.

</details>

### Modules

A `module` block is a logical boundary in the code.
A realization module uses `realizes` to name its DPs.
The architecture profile needs a full contract for each module:

| Field | Meaning |
|---|---|
| `inputs`, `outputs` | Lists of strings that describe the data in and out. |
| `owns_state` | References to `state` blocks that this module owns. Write `[]` when it owns none. |
| `dependencies` | References to other modules. Write `[]` when there are none. |
| `invariants` | Facts that are always true for this module. |
| `failure_behavior` | What the module does when something fails. |
| `acceptance_checks` | References to criteria or scenarios. Never prose. |

An empty list is a statement: "this module has none".
A missing field means "not stated".
The architecture profile needs the statement.

### Scenarios

A `scenario` block describes a test case.
Its `kind` is `operational`, `change`, or `failure`.
`verifies` lists the criteria that the scenario tests.
`steps` is a list of instructions in words.

A scenario is a plan for a test.
It does not say that the test ran or passed.

### Add the modules and scenarios

Add these blocks to `notes.ad.hcl`:

```hcl
module "store" {
  realizes = [dp.note_store]
  inputs = ["The text of one new note."]
  outputs = ["The ID of the saved note."]
  owns_state = []
  dependencies = []
  invariants = ["A saved note is never changed by a search."]
  failure_behavior = "If the write fails, reply with an error and save nothing."
  acceptance_checks = [fr.save_note.criterion.save_time]
}

module "index" {
  realizes = [dp.word_index]
  inputs = ["The saved rows.", "One search word."]
  outputs = ["The IDs of the notes that contain the word."]
  owns_state = []
  dependencies = [module.store]
  invariants = ["The index never writes to the note table."]
  failure_behavior = "If the index is not ready, reply with an error and not with an empty list."
  acceptance_checks = [fr.find_notes.criterion.complete_results]
}

scenario "save_is_fast" {
  kind = "operational"
  verifies = [fr.save_note.criterion.save_time]
  steps = ["Save 1000 notes of 1 to 500 words.", "Measure the time from each request to its reply."]
}

scenario "search_finds_all" {
  kind = "operational"
  verifies = [fr.find_notes.criterion.complete_results]
  steps = ["Save 100 notes with known words.", "Search for each word.", "Compare each result with the expected list."]
}
```

Run the architecture profile again.
The result is `Errors: 0` and four `support_gap` warnings, one for each influence.
The model is now complete for this profile.

### Process variables and flows

Two more blocks connect the design to real things.
A `pv` block names the code, package, or resource that realizes a DP:

```hcl
pv "notes_table" {
  realizes = [dp.note_store]
  kind = "database table"
  note = "The notes table in the local database."
}
```

A `flow` block gives the runtime order of modules, for example `steps = [module.store, module.index]`.
The runtime order is different from the design order.
The design order tells you which decision to make first.
The flow tells you which code runs first.

---

## Lesson 13: Premises and contexts

Many claims are true only under a condition.
The `0` between `word_index` and `save_note` is true only if the save replies before the index update.
Write that condition as an `assumption`, and link it with `holds_if`:

```hcl
assumption "index_after_reply" {
  statement = "The save path sends its reply before the index update starts."
  status = "to_validate"
}
```

Then add `holds_if = [assumption.index_after_reply]` to the `none` influence.
The `status` is `assumed`, `to_validate`, `validated`, or `invalidated`.

The tool now reports a `support_gap` on the assumption too.
A claim that depends on an open premise gives only a conditional result.
If you set the status to `invalidated`, the claim loses its support.

Three more blocks describe the operating conditions:

| Block | Purpose |
|---|---|
| `workload` | The inputs and their ranges, for example `ranges = { note_words = { min = 1, max = 500 } }`. |
| `context` | A named operating condition. It can list assumptions in `assumes`. |
| `state` | Information that a leaf DP owns (`owns_state`) or reads (`reads_state`). |

Use `under = context.x` on an influence or a criterion to make it apply only in that context.
Two contexts that cannot happen together go in `excludes`.
Then each context can have its own matrix without a conflict.

---

## Lesson 14: Split the model and add attachments

A real model grows too large for one file.
Split it by domain and by branch.
Never put all FRs in one file and all DPs in another file.
A child FR points to its parent DP, so one file holds one zigzag step.

The recommended files are these:

| File | Contents |
|---|---|
| `needs.ad.hcl` | Stakeholders, needs, and constraints. |
| `context.ad.hcl` | Assumptions, contexts, and workloads. |
| `design.ad.hcl` | The design root and the top-level FRs, DPs, influences, and decisions. |
| `design.BRANCH.ad.hcl` | One branch, for example `design.word_index.ad.hcl`. |
| `process.ad.hcl` | PVs, modules, flows, and scenarios. |

Never write a matrix file.
The tool derives every matrix from the influences.

### A folder as input

Make a folder `notes/`.
Put the design blocks in `notes/design.ad.hcl` and the modules and scenarios in `notes/process.ad.hcl`.
Then run the tool on the folder:

```sh
adhcl validate --profile architecture notes
```

The tool reads every `*.ad.hcl` file directly in the folder and merges them.
It does not read subfolders.
The result is the same as for one file.

### A project manifest and attachments

Some data belongs to other tools, for example a Terraform address or a page layout.
That data does not go in the core files.
It goes in an attachment file with the suffix `.ad.ext.hcl`.
A manifest with the suffix `.ad.project.hcl` lists all the files and the extension owners.

An extension owner is a built-in part of `adhcl` that reads one kind of attachment.
There are three:

| Owner label | Role | Subject | Data fields |
|---|---|---|---|
| `terraform_binding` | `binding` | a `pv` | `address`, `observation_source` |
| `event_model_link` | `behavior_link` | a `module` | `model`, `revision`, `target_kind = "slice"`, `target_label` |
| `html_view` | `view` | the `design` | `layout`, `show_source_locations = true` |

Make `notes/model.ad.project.hcl`:

```hcl
project "notes" {
  language = "requirements_hcl/core/1"
  core_files = ["design.ad.hcl", "process.ad.hcl"]
  attachment_files = ["views.ad.ext.hcl"]
}

extension "html_view" {
  role = "view"
  contract = "requirements_hcl/html_view/1"
}
```

Make `notes/views.ad.ext.hcl`:

```hcl
attachment "review_layout" {
  owner = extension.html_view
  subject = design.notes
  data = {
    layout = "requirements_first"
    show_source_locations = true
  }
}
```

Run the tool on the manifest:

```sh
adhcl validate --profile architecture notes/model.ad.project.hcl
```

The Owners part of the report now shows `review_layout on design.notes: valid.`
Only a manifest loads attachments.
A file or a folder input ignores them.

An attachment cannot change a core fact.
It cannot add a matrix cell or change a classification.
The binding and behavior owners report `unknown` with a warning, because `adhcl` gets no observations and no behavior models.
An `unknown` result never counts as success.

---

## Lesson 15: Decisions and evidence

A `decision` block compares candidate designs for the same FRs.
Each `candidate` lists its DPs.
Here is a decision with one candidate:

```hcl
decision "note_search" {
  addresses = [fr.save_note, fr.find_notes]
  candidate "word_map_index" {
    dps = [dp.note_store, dp.word_index]
    version = "notes-proposal-1"
    information {
      basis = "unknown"
    }
  }
  selected = "word_map_index"
  provisional = true
  why = "A word map is simple. No test results exist yet."
}
```

The tool reports `unresolved_feasibility` as a warning.
No evidence shows that this candidate meets the criteria.

The Information Axiom picks the design with the highest chance of success.
Information content is `I = -log2(p)`, where `p` is the chance that all FRs succeed together.
The language has strict rules for `p`:

1. You cannot type a probability. It comes only from an `evidence` block with measured trials.
2. The evidence names the candidate version, context, workload, time horizon, and a scenario that covers every criterion.
3. Each trial measures all FRs together. You cannot multiply separate success rates.
4. Zero failures do not prove `p = 1`. The tool gives an interval, not a certainty.
5. Without such evidence, the information content stays unknown and the decision stays provisional.

These rules stop a model from showing numbers that nobody measured.

---

## Mixed review

These questions mix all the lessons.
The mix is on purpose: in real work, you must first decide which idea a problem needs.
Answer all of them before you open the answers.

1. A teammate writes `effect = "none"` with no other field. What does the tool report?
2. Which block makes every unlisted cell in one sibling set a zero?
3. You run a folder that contains `model.ad.project.hcl`. Does the tool read the attachments?
4. Which field of a module can contain only references, never prose?
5. A matrix has `X` in (FR1, DP1), (FR2, DP2), (FR2, DP1), and (FR1, DP2). Which classification, and which block can record it?
6. What is the reference to the criterion `uptime` inside `fr "serve_api"`?
7. Under the `source` profile, a leaf FR has no scenario. Error or warning? And under `architecture`?
8. A test ran 500 times with zero failures. Can you claim `p = 1`?
9. Where does a Terraform resource address belong?
10. You add `parent = dp.x` to an FR. Which scope does the FR now belong to?

<details>
<summary>Answers</summary>

1. An `invalid_structure` error: a none influence needs a because reason.
2. A `cells` block with `unlisted = "none"` and a `because`.
3. No. A folder input reads only the `*.ad.hcl` files. Give the manifest path to load attachments.
4. `acceptance_checks`. It takes criterion or scenario references.
5. Coupled. A `coupling` block records it, with the DPs and FRs in `affects`.
6. `fr.serve_api.criterion.uptime`.
7. A warning (`missing_leaf_scenario`) under `source`, an error under `architecture`.
8. No. Zero failures never establish `p = 1`. The evidence gives an interval.
9. In a `terraform_binding` attachment on a `pv`, in a `.ad.ext.hcl` file. Do not repeat it in the core `pv` block.
10. The scope `dp.x`, the sibling set of the children of that DP.

</details>

---

## Final exercise: a link shortener

Now design a model alone.
Do not look at the notes model while you write.
Look back only when you are stuck.

A link shortener has two outcomes:

1. It returns a new short code for a long web address. A code never points to two addresses.
2. It sends a visitor from a short code to its address within 50 milliseconds.

The generator makes codes, and the redirect part looks them up.
The redirect part never makes or changes a code.

Your model is done when all of these are true:

1. `adhcl validate --profile architecture links.ad.hcl` reports `Errors: 0`.
2. The only warnings are `support_gap`.
3. An `expect` block states the classification and the design order.
4. Each FR has an operational criterion and a scenario.

Use the hints only when you are stuck, one at a time.

<details>
<summary>Hint 1</summary>

Start with the design root, one need, and the two FRs with criteria. Run the tool. Fix the errors before you add more.

</details>

<details>
<summary>Hint 2</summary>

Fill all four cells. Ask for each cell: if I change this DP, can this FR miss its target? The redirect part depends on the code format.

</details>

<details>
<summary>Hint 3</summary>

The design is decoupled. The generator comes first in the design order.

</details>

<details>
<summary>One possible solution</summary>

```hcl
design "links" {
  boundary = "Make a short code for a long web address and send visitors from the code to the address. Accounts and click counts are outside the boundary."
}

need "share_links" {
  statement = "Share a long web address as a short one."
  origin = "proposed"
}

fr "make_code" {
  need = [need.share_links]
  statement = "Return a new short code for a long address."
  criterion "unique_code" {
    metric = "number of codes that point to two different addresses"
    op = "=="
    value = 0
    origin = "proposed"
  }
}

fr "redirect" {
  need = [need.share_links]
  statement = "Send a visitor from a short code to its address."
  criterion "redirect_time" {
    metric = "milliseconds from the request to the redirect reply"
    op = "<="
    value = 50
    unit = "ms"
    origin = "proposed"
  }
}

dp "code_generator" {
  controls = [fr.make_code]
  responsibility = "Make a code from a counter that only goes up, and save the code with its address."
  decision = "selected"
}

dp "code_cache" {
  controls = [fr.redirect]
  responsibility = "Keep codes and addresses in memory and fall back to the saved table on a miss."
  decision = "selected"
}

influence {
  from = [dp.code_generator]
  to = fr.make_code
  effect = "material"
  mechanism = "The counter gives each address a new code, so no code repeats."
}

influence {
  from = [dp.code_cache]
  to = fr.redirect
  effect = "material"
  mechanism = "A hit in memory is fast and a miss reads the table, so the cache sets the reply time."
}

influence {
  from = [dp.code_generator]
  to = fr.redirect
  effect = "material"
  mechanism = "The cache looks up the codes that the generator makes. A change to the code format changes the lookup."
}

influence {
  from = [dp.code_cache]
  to = fr.make_code
  effect = "none"
  because = "The cache only reads codes. It never makes or changes one."
}

expect "top_level" {
  scope = design.links
  classification = "decoupled"
  order = [dp.code_generator, dp.code_cache]
}

module "generator" {
  realizes = [dp.code_generator]
  inputs = ["One long web address."]
  outputs = ["One new short code."]
  owns_state = []
  dependencies = []
  invariants = ["A saved code never changes its address."]
  failure_behavior = "If the save fails, reply with an error and give no code."
  acceptance_checks = [fr.make_code.criterion.unique_code]
}

module "redirector" {
  realizes = [dp.code_cache]
  inputs = ["One short code."]
  outputs = ["A redirect to the address, or a not found reply."]
  owns_state = []
  dependencies = [module.generator]
  invariants = ["The redirector never writes to the code table."]
  failure_behavior = "If the code is not known, reply with not found."
  acceptance_checks = [fr.redirect.criterion.redirect_time]
}

scenario "no_repeated_codes" {
  kind = "operational"
  verifies = [fr.make_code.criterion.unique_code]
  steps = ["Make codes for 10000 addresses.", "Count the codes that point to two addresses."]
}

scenario "fast_redirect" {
  kind = "operational"
  verifies = [fr.redirect.criterion.redirect_time]
  steps = ["Request 1000 known codes.", "Measure the time from each request to its reply."]
}
```

Your text can be different. Compare the structure: four influences, one `expect`, one module for each DP, and one scenario for each criterion.

</details>

To go further, make the design coupled on purpose.
For example, let the generator read the cache to skip codes that are in use.
Predict the new matrix, run the tool, and then add a `coupling` block.

---

## Review plan

You forget most new material within a few days unless you practice recall.
Use this plan after you finish the guide:

1. After one day: answer the Mixed review again without notes. Then write the notes model from memory, up to Lesson 6.
2. After three days: do the six error changes of Lesson 8 again on the link shortener. Predict each code first.
3. After one week: model a small part of your own software. Write at least two FRs, all four cells, and one `expect` block.
4. After one month: add modules and scenarios to your own model and pass the architecture profile.

When you write your own model, ask a colleague or an AI assistant to review your influences.
Explain each `X` and each `0` in your own words, and let the reviewer ask why.
Do not ask the assistant to write the model for you.
You learn the method when you do the thinking.

---

## Quick reference

### Blocks you use most

| Block | Label | Required fields | Common optional fields |
|---|---|---|---|
| `design` | yes | `boundary` | `level`, `workload` |
| `need` | yes | `statement` | `why`, `stakeholder`, `origin` |
| `fr` | yes | `statement`, and `need` on a top-level FR | `parent`, `alias`, `bounded_by`, `criterion` blocks |
| `criterion` (in `fr`) | yes | `statement`, or `metric` + `op` + `value` | `unit`, `under`, `origin`, `allocated_from` |
| `dp` | yes | `controls`, `responsibility`, `decision` | `why`, `alias`, `owns_state`, `reads_state`, `holds_if` |
| `influence` | no | `from`, `to`, `effect` | `mechanism`, `because`, `mechanism_source`, `under`, `holds_if`, `cites` |
| `cells` | yes | `scope`, `unlisted` | `because`, required for `none` |
| `expect` | yes | `scope`, `classification` | `order`, `basis`, `under` |
| `coupling` | yes | `scope`, `affects`, `reason` | `iteration_bound`, `convergence`, `stopping`, `failure_behavior` |
| `assumption` | yes | `statement` | `status` |
| `module` | yes | `realizes` or `contains` | `inputs`, `outputs`, `owns_state`, `dependencies`, `invariants`, `failure_behavior`, `acceptance_checks` |
| `pv` | yes | `realizes` | `kind`, `address`, `note` |
| `scenario` | yes | `kind` | `verifies`, `steps`, `vary`, `expect_affected`, `expect_unaffected`, `description` |
| `decision` | yes | `addresses`, one or more `candidate` blocks | `selected`, `provisional`, `why` |

The full list of blocks and fields is in the [field schema](https://github.com/axiomatic-design-hcl/spec/blob/main/docs/schema.md).

### Codes you see most

| Code | What to do |
|---|---|
| `invalid_structure` | A field is missing, unknown, or of the wrong type. Read the message. |
| `invalid_reference` | The reference names no block, or a block of the wrong type. Look for a typo. |
| `uncontrolled_requirement` | Add a selected DP that controls the FR. |
| `ineffective_control` | Add the material diagonal influence, or change the pairing. |
| `conflicting_influence` | Two influences disagree for one cell. Remove one, or separate them by context. |
| `unresolved_influence` | State the unknown cells with influences or a `cells` default. |
| `failed_expectation` | The result differs from your `expect` block. Find out which one is wrong. |
| `incomplete_feedback_contract` | Remove the coupling, or add a complete `coupling` block. |
| `support_gap` | A claim has no reviewed support. This warning stays until a review exists. |

### Rules to remember

1. Write each fact once. Never write a matrix, an ID number, or a classification by hand.
2. An unlisted cell is unknown, not zero.
3. `material` needs `mechanism`. `none` needs `because`.
4. Mark your own reasoning with `origin = "inferred"` or `mechanism_source = "inferred"`.
5. Do not invent targets, mechanisms, or probabilities. Leave the gap, and let the tool report it.
6. Exit code 0 means a valid model, not a proven design.

## Where to go next

These documents are the full reference:

1. The [language reference](https://github.com/axiomatic-design-hcl/spec/blob/main/docs/language.md) explains every block and rule.
2. The [field schema](https://github.com/axiomatic-design-hcl/spec/blob/main/docs/schema.md) lists every field and type.
3. The [diagnostic contract](https://github.com/axiomatic-design-hcl/spec/blob/main/docs/diagnostics.md) lists every code and its severity in each profile.
4. The [assessment contract](https://github.com/axiomatic-design-hcl/spec/blob/main/docs/assessment-contract.md) explains how the tool derives its results.
5. The [starter example](https://github.com/axiomatic-design-hcl/spec/tree/main/examples/starter) shows a complete project with all three attachment roles.
6. The [adhcl README](https://github.com/axiomatic-design-hcl/adhcl#readme) explains the command line, the inputs, and the exit codes.
7. The [Axiomatic Design plugin](https://github.com/axiomatic-design-hcl/axiomatic-design-plugin) adds two skills to Claude Code. One skill applies the method to a system. The other skill writes the design as `.ad.hcl` files. The [plugin page](plugin.html) describes both skills.
