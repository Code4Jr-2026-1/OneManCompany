## ADDED Requirements — Group Classes

---

### Requirement: Group class setup
The system SHALL allow the coach to create, edit, and delete group class definitions with a fixed recurring schedule, skill level, capacity, and per-student group rate.

#### Scenario: Coach creates a group class
- **WHEN** the coach fills in the "New Group Class" form (name, skill level, max capacity, day of week, start time, duration, price per student per session) and submits
- **THEN** a `GroupClass` record is saved and the class appears in the coach's group class list

#### Scenario: Coach edits a group class
- **WHEN** the coach changes the capacity or price on an existing class
- **THEN** the record is updated; existing enrollments are not affected unless capacity is reduced below current enrollment count (system warns coach)

#### Scenario: Coach deletes a group class
- **WHEN** the coach deletes a class that has enrolled students
- **THEN** the system requires confirmation, notifies all enrolled students, and marks the class as CANCELLED rather than hard-deleting

---

### Requirement: Student enrollment in group classes
The system SHALL allow the coach to enroll students into a group class, handle over-capacity via a waitlist, and drop students at any time.

#### Scenario: Coach enrolls a student (capacity available)
- **WHEN** the coach selects a student and enrolls them in a group class with open spots
- **THEN** a `GroupEnrollment` record is created with status ACTIVE and the student appears on the class roster

#### Scenario: Coach enrolls a student (class full)
- **WHEN** the coach enrolls a student into a full class
- **THEN** the enrollment is created with status WAITLISTED; coach sees waitlist position

#### Scenario: Coach drops a student
- **WHEN** the coach drops a student from a group class
- **THEN** the enrollment status is set to DROPPED; if a waitlisted student exists, the next in queue is promoted to ACTIVE

---

### Requirement: Group session logging
The system SHALL allow the coach to log a session for an entire group class in one action, with shared notes and homework auto-assigned to all currently enrolled (ACTIVE) students.

#### Scenario: Coach logs a group session
- **WHEN** the coach opens a group class and selects "Log Session", adds topics covered and notes, and saves
- **THEN** a `GroupSession` record is created; a `Homework` record (if set) is created for each ACTIVE enrolled student

#### Scenario: Coach assigns group homework
- **WHEN** the coach adds a homework task during group session logging
- **THEN** the same homework title and description are linked to every ACTIVE enrolled student with the same due date

#### Scenario: AI summary of group session
- **WHEN** a group session is saved
- **THEN** the system calls Claude to generate a concise group session summary (topics, key teaching moments) and stores it on the `GroupSession` record

---

### Requirement: Group class calendar view
The system SHALL display all group class occurrences and personal sessions in a unified weekly/monthly calendar, visually distinguishing group slots from private (personal) sessions.

#### Scenario: Coach opens the schedule calendar
- **WHEN** the coach navigates to the Schedule page
- **THEN** recurring group class slots appear in a distinct colour (e.g. teal) and private sessions appear in a second colour (e.g. blue)

#### Scenario: Coach clicks a group class slot
- **WHEN** the coach clicks a group class slot on the calendar
- **THEN** a popover shows class name, enrolled student count / capacity, and quick links to log session or view roster

#### Scenario: Coach clicks a personal session slot
- **WHEN** the coach clicks a private session slot on the calendar
- **THEN** a popover shows the student name, session duration, and links to view student profile or log notes

---

### Requirement: Group class billing
The system SHALL track per-student billing for group classes at the class's group rate, separate from private lesson billing, and surface a monthly group billing summary.

#### Scenario: Coach views group billing for a month
- **WHEN** the coach opens the Billing page and selects the "Group Classes" tab
- **THEN** a table shows each enrolled student, the number of group sessions attended that month, the group rate, and the total amount owed

#### Scenario: Coach marks a student's group invoice as paid
- **WHEN** the coach toggles "Paid" on a student's group billing row
- **THEN** the record is updated with paid=true and the payment date; the row is visually marked as settled

#### Scenario: Group rate differs from private rate
- **WHEN** billing is calculated for a group class
- **THEN** the system uses `GroupClass.groupRate` (not `User.hourlyRate`) for that student's group sessions

---

### Requirement: Group class roster view
The system SHALL give the coach a dedicated roster page per group class showing enrolled students, their status, and quick access to individual profiles.

#### Scenario: Coach opens group class roster
- **WHEN** the coach opens a group class detail page
- **THEN** a table shows all enrollments with columns: student name, status (ACTIVE / WAITLISTED), enrollment date, and action buttons (Drop, View Profile)

#### Scenario: Coach views waitlist position
- **WHEN** a student is on the waitlist
- **THEN** their waitlist position number is shown (e.g. "Waitlist #2")
