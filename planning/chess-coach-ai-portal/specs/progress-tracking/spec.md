## ADDED Requirements

### Requirement: Monthly progress snapshot
The system SHALL record a monthly snapshot of each student's key metrics: chess rating, topic mastery scores, session count, win/loss record, and coach rating of overall progress.

#### Scenario: Monthly snapshot created
- **WHEN** the first day of a new month arrives (or coach triggers manually)
- **THEN** a progress snapshot is recorded for each active student

### Requirement: Progress chart over time
The system SHALL display a visual chart of a student's rating and progress score over months.

#### Scenario: Student views their progress chart
- **WHEN** the student opens the Progress tab
- **THEN** a line chart displays their rating trend and monthly progress scores over the past 12 months

#### Scenario: Coach views student progress chart
- **WHEN** the coach opens a student's progress tab
- **THEN** the same chart is shown alongside coach-only metrics (session attendance, homework completion)

### Requirement: Topic mastery tracking
The system SHALL track a student's mastery level per chess topic (e.g., openings, endgames, tactics, positional play) updated after each session or analysis.

#### Scenario: Topic mastery updated
- **WHEN** a game analysis or session note references a specific topic
- **THEN** the student's mastery score for that topic SHALL be updated accordingly

#### Scenario: Topic mastery displayed
- **WHEN** either coach or student views the progress page
- **THEN** a topic mastery breakdown is shown as a radar/spider chart or table

### Requirement: Improvement rate indicator
The system SHALL calculate and display an improvement rate comparing the student's current period performance to the previous period.

#### Scenario: Improvement rate shown on coach dashboard
- **WHEN** a coach views their student list
- **THEN** each student card shows an improvement rate indicator (improving / plateau / declining)
