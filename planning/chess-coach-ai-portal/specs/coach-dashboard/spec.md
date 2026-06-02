## ADDED Requirements

### Requirement: Student roster overview
The system SHALL show the coach a dashboard listing all their students with key status indicators: current rating, improvement trend, last active date, and plan progress.

#### Scenario: Coach opens dashboard
- **WHEN** the coach logs in and navigates to the dashboard
- **THEN** all students are shown as cards or rows with live status indicators

#### Scenario: Student sorted by status
- **WHEN** the coach sorts by "needs attention"
- **THEN** students with declining progress or missed sessions appear at the top

### Requirement: Per-student AI coaching suggestions
The system SHALL generate AI-powered coaching suggestions for each student based on their recent activity, progress data, and current plan — visible only to the coach.

#### Scenario: Coach views student detail
- **WHEN** the coach opens a student's detail page
- **THEN** an AI-generated coaching insight panel shows suggestions such as "Focus on endgame practice — 3 recent losses due to endgame mistakes"

### Requirement: Session notes entry by coach
The system SHALL allow a coach to add structured or free-text notes after each coaching session, which are saved to the student's history and used to update their context.

#### Scenario: Coach adds session notes
- **WHEN** the coach saves session notes for a student
- **THEN** the notes are timestamped, stored in the student's history, and trigger an update to the student's AI context document

### Requirement: Coach alert system
The system SHALL proactively alert the coach when a student has not been active for more than a configurable number of days, or when their progress drops significantly.

#### Scenario: Student inactive alert
- **WHEN** a student has had no activity for 7 or more days (configurable)
- **THEN** the coach dashboard shows an alert badge on that student's card

### Requirement: Bulk progress overview
The system SHALL provide the coach with a summary view across all students — showing aggregate improvement rates, average ratings, and which students are on track vs. behind plan.

#### Scenario: Coach views summary metrics
- **WHEN** the coach opens the "Overview" tab
- **THEN** aggregate stats are shown: total students, % improving, average rating change this month
