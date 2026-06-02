## ADDED Requirements

### Requirement: In-app messaging between coach and student
The system SHALL provide a simple messaging interface so coaches and students can communicate directly within the portal.

#### Scenario: Coach sends a message to student
- **WHEN** the coach sends a message from the student's detail page
- **THEN** the student receives the message in their portal inbox

#### Scenario: Student replies to coach
- **WHEN** the student sends a reply
- **THEN** the coach sees the reply in their messages panel

### Requirement: Notification of new messages
The system SHALL send an in-app notification (and optionally email) when a new message is received by any user.

#### Scenario: Student receives coach message notification
- **WHEN** a coach sends a message and the student is not currently logged in
- **THEN** the student receives an email notification with a link to the portal

### Requirement: Parent report delivery tracking
The system SHALL track whether a parent report email has been opened/viewed and surface this status to the coach.

#### Scenario: Coach checks report delivery status
- **WHEN** the coach views the sent reports list
- **THEN** each report shows a delivery status: Sent / Opened / Not yet opened

### Requirement: Announcement broadcast by coach
The system SHALL allow a coach to send a broadcast message to all students or a selected group (e.g., all students in a class or program).

#### Scenario: Coach sends group announcement
- **WHEN** the coach creates an announcement and selects recipients
- **THEN** all selected students receive the message in their inbox
