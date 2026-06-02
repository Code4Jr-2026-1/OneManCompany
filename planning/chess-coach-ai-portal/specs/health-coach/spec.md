## ADDED Requirements

### Requirement: Wellness check-in for students
The system SHALL present a brief wellness check-in at the start of each AI mentor session, asking the student how they are feeling physically and mentally.

#### Scenario: Student completes wellness check-in
- **WHEN** a student opens an AI mentor session
- **THEN** the system asks 2-3 quick questions about sleep, energy, and mood before starting the chess session

#### Scenario: Poor wellness detected
- **WHEN** a student reports low energy or high stress
- **THEN** the AI mentor SHALL acknowledge this, suggest a lighter session, and offer a brief relaxation or focus tip before starting

### Requirement: Mental performance tips integrated into sessions
The system SHALL include targeted mental performance tips (focus, handling pressure, bouncing back from mistakes) relevant to the student's current situation within mentor sessions.

#### Scenario: Mental tip shown after game loss analysis
- **WHEN** a student completes analysis of a game they lost
- **THEN** the AI mentor SHALL include a mental resilience tip alongside the chess feedback

### Requirement: Wellness history logged per student
The system SHALL log wellness check-in responses over time so the coach can identify patterns (e.g., consistently low energy on certain days).

#### Scenario: Coach views student wellness trend
- **WHEN** the coach opens the wellness tab for a student
- **THEN** a chart showing mood, energy, and sleep scores over the past month is displayed

### Requirement: Health coach tips library
The system SHALL maintain a curated set of health and mental performance tips appropriate for junior and adult chess players, used by the AI to deliver context-relevant advice.

#### Scenario: Tips delivered are age-appropriate
- **WHEN** the AI mentor delivers a health tip to a student under 16
- **THEN** the tip SHALL use simple, encouraging language and age-appropriate examples
