## ADDED Requirements

### Requirement: AI-generated improvement plan
The system SHALL generate a personalised improvement plan for a student using their current context, weaknesses, goals, and target timeline.

#### Scenario: Coach requests an improvement plan
- **WHEN** the coach clicks "Generate Plan" for a student
- **THEN** the AI SHALL produce a structured plan with monthly topics, practice goals, and milestones based on the student's profile and history

### Requirement: Plan contains topics and milestones
The system SHALL structure each improvement plan as a list of chess topics to study, with target completion dates and measurable milestones per topic.

#### Scenario: Plan displayed to student
- **WHEN** the student views their active plan
- **THEN** they see a list of topics with descriptions, deadlines, and a progress bar per topic

#### Scenario: Milestone completion marked
- **WHEN** a coach or student marks a milestone as complete
- **THEN** the milestone status is saved and the overall plan progress is updated

### Requirement: Plan editing by coach
The system SHALL allow the coach to edit any part of an AI-generated plan — add, remove, or modify topics and milestones — before activating it for the student.

#### Scenario: Coach edits a generated plan
- **WHEN** the coach modifies a topic or deadline in the plan editor
- **THEN** changes are saved and the student sees the updated plan

### Requirement: Plan history
The system SHALL retain all past improvement plans for a student, not just the current active one.

#### Scenario: Coach views past plans
- **WHEN** the coach opens the plan history for a student
- **THEN** all previous plans are listed with start date, end date, and completion rate
