# Design reference

The primary-screen [concept](concept.png) was generated with the built-in `image_gen` tool. Brief: a restrained, complete Gradeback utility with a white canvas, ink/navy type, deep teal actions, a four-step form beside an estimated-result panel, and an annotated screenshot guide below. No marketing illustrations, badges, gradients, or decorative cards.

## Design system

- White page; `#18302f` text; `#5c6b70` secondary text.
- `#146657` actions; `#eff5f3` result surface; `#dce3e5` hairline borders.
- Neutral system sans serif, 34px desktop headline, 21px section titles, 15–16px inputs and labels, 12–13px explanatory text.
- 1080px content width; 20px two-column gap; 12px panel corners; 24px panel padding; 43–48px inputs/actions.
- Small numbered circles connect the form to the screenshot annotations. Coral SVG ellipses mark exact source values.
- At 640px and below, stack form, result, and guide; screenshot regions scroll horizontally without page overflow. Result receives focus after submission.

## Implementation refinements

The supplied real gradebook screenshots replace the generated concept’s invented example screenshot. The initial state has blank fields and an empty result; “Try the example” loads the reference values. The user’s requested **Student Gradebook → Calculation → Homework → Points Earned** navigation appears directly at the field and in detailed screenshot help. Validation, multiple past-test rows, help dialogs, and the latest-test tab extend the same component and typography system.

The user subsequently requested the title **Dannys Pearson Calculator**, exact subtitle **Made because your lazy ass dont want to figure out my formula**, and an unserious tone. These replace the concept’s original product name and copy; controls and supporting text use the requested humor while input labels and screenshot instructions retain clear meanings. The visual layout and design system remain based on the concept.
