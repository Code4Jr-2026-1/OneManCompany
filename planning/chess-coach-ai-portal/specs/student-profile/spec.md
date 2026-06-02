## ADDED Requirements

### Requirement: Student profile creation
The system SHALL allow a coach to create a student profile containing name, age, current chess rating, skill level, learning goals, and any personal notes.

#### Scenario: Coach creates a new student profile
- **WHEN** the coach submits the new student form with required fields
- **THEN** a student profile is created and appears in the coach's student list

#### Scenario: Duplicate student name warning
- **WHEN** the coach creates a student with a name that already exists in their roster
- **THEN** the system SHALL warn the coach before saving

### Requirement: Persistent student context
The system SHALL maintain a structured context document per student that accumulates game history, session notes, identified weaknesses, strengths, and coach observations over time.

#### Scenario: Context updated after session
- **WHEN** a coach adds session notes or a student completes a game analysis
- **THEN** the student's context document is updated and used in all subsequent AI interactions

#### Scenario: Context available to AI mentor
- **WHEN** a student starts an AI mentor session
- **THEN** the AI SHALL have access to the student's full context including history summary and recent raw notes

### Requirement: Student profile editing
The system SHALL allow a coach to update any field of a student's profile at any time.

#### Scenario: Coach updates student rating
- **WHEN** the coach changes the student's current chess rating
- **THEN** the new rating is saved and reflected in progress tracking and AI context

### Requirement: Student history log
The system SHALL maintain a chronological log of all sessions, game analyses, plans, and coach notes for each student.

#### Scenario: Coach views student history
- **WHEN** the coach opens a student's history tab
- **THEN** all past sessions, analyses, and notes are listed in reverse chronological order
