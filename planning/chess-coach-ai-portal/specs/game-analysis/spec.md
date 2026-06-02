## ADDED Requirements

### Requirement: PGN game input for analysis
The system SHALL allow a student or coach to submit a chess game in PGN format for AI-powered analysis.

#### Scenario: Student submits a PGN game
- **WHEN** the student pastes a valid PGN and clicks "Analyse"
- **THEN** the system SHALL parse the PGN, extract moves, and send to the AI for analysis

#### Scenario: Invalid PGN submitted
- **WHEN** the student submits malformed or unparseable PGN
- **THEN** the system SHALL display a clear error message and not call the AI

### Requirement: AI move-by-move feedback
The system SHALL generate AI feedback that highlights critical moments, mistakes, missed opportunities, and patterns in the submitted game.

#### Scenario: Analysis result displayed
- **WHEN** the AI analysis is complete
- **THEN** the system SHALL display key moments with explanations, an overall game summary, and detected patterns (e.g., "tends to weaken kingside with early pawn pushes")

### Requirement: Analysis saved to student history
The system SHALL automatically save completed game analyses to the student's history and update the student's context document with detected patterns.

#### Scenario: Pattern detected in analysis
- **WHEN** the AI identifies a recurring weakness in a student's game
- **THEN** that weakness SHALL be appended to the student's context document for use in future AI mentor sessions

### Requirement: Coach can view student's analyses
The system SHALL allow a coach to see all game analyses submitted by a student.

#### Scenario: Coach reviews student analysis
- **WHEN** the coach navigates to a student's game analyses tab
- **THEN** all past analyses are listed with date, result, and a summary of key findings
