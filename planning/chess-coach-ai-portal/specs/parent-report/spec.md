## ADDED Requirements

### Requirement: Automated monthly parent report generation
The system SHALL automatically generate a monthly progress report per student using AI, drawing from session notes, game analyses, plan progress, and wellness data.

#### Scenario: Monthly report generated automatically
- **WHEN** the end of the month arrives
- **THEN** a draft parent report is generated for each student and placed in a coach review queue

### Requirement: Coach review and approval before delivery
The system SHALL require the coach to review and optionally edit the generated parent report before it is sent to the parent.

#### Scenario: Coach reviews report
- **WHEN** the coach opens the pending report for a student
- **THEN** they can read, edit any section, and then approve or discard it

#### Scenario: Coach sends approved report
- **WHEN** the coach clicks "Send to Parent"
- **THEN** the report is delivered to the parent's registered email address and marked as sent

### Requirement: Report covers key progress areas
The system SHALL generate reports that include: rating change, topics studied, goal progress, strengths observed, areas for improvement, and a coach message section.

#### Scenario: Parent receives report
- **WHEN** a parent opens the report email or in-app link
- **THEN** they see a clearly structured, jargon-free summary of their child's chess progress this month

### Requirement: Parent can view report history in-app
The system SHALL allow parents to log in and view all past reports sent for their child.

#### Scenario: Parent views past reports
- **WHEN** the parent logs in and opens the Reports tab
- **THEN** all historical reports are listed with dates and are readable in full
