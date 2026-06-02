## ADDED Requirements

### Requirement: Personalised AI mentor chat for students
The system SHALL provide each student with a conversational AI mentor that has full awareness of the student's profile, history, current plan, and past sessions.

#### Scenario: Student asks a chess question
- **WHEN** a student sends a message to the AI mentor
- **THEN** the AI SHALL respond with context-aware guidance informed by the student's known weaknesses, current topics, and history

#### Scenario: First session for new student
- **WHEN** a student with no history opens the mentor for the first time
- **THEN** the AI SHALL introduce itself and ask about the student's current level and goals to begin building context

### Requirement: Mentor explains chess concepts
The system SHALL allow the AI mentor to explain chess concepts (openings, tactics, endgames, strategy) at a level appropriate for the student's skill level stored in their profile.

#### Scenario: Mentor adapts explanation to skill level
- **WHEN** a beginner student asks about the Sicilian Defence
- **THEN** the AI SHALL give a simplified, encouraging explanation rather than advanced theory

### Requirement: Session summary saved after mentor chat
The system SHALL automatically generate and save a brief summary of each mentor session, including topics discussed and any new insights about the student's learning.

#### Scenario: Session ends (student closes chat)
- **WHEN** the student closes or ends the mentor chat session
- **THEN** a session summary is saved to the student's history and the student context document is updated

### Requirement: Mentor encouragement and motivation
The system SHALL include motivational and encouraging language appropriate for the student's age and current progress, not just technical feedback.

#### Scenario: Student is discouraged after a loss
- **WHEN** the student expresses frustration or discouragement
- **THEN** the AI mentor SHALL acknowledge their feelings, reframe the loss as a learning opportunity, and highlight recent progress
