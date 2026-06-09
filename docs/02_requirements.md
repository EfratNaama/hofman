# Software Requirements Specification (SRS)
Beit Hoffman Website – Information, Activities and Registration for Senior Citizens

---

## Functional Requirements (FR)

### Home Page

**FR-01**
The system shall display the next 5 upcoming events on the home page, sorted by date in ascending order.

Acceptance Criteria:
When 8 future events exist, only the next 5 are displayed in chronological order.

**FR-02**
The system shall display the 3 most recent announcements on the home page.

Acceptance Criteria:
When 5 announcements exist, only the 3 newest announcements are displayed.

**FR-03**
The system shall display a photo gallery containing uploaded images.

Acceptance Criteria:
After uploading 8 images, all images appear in the gallery.

---

### Activities Catalog

**FR-04**
The system shall display all active activities including title, category, day, time and available spots.

**FR-05**
The user shall be able to filter activities by category.

**FR-06**
The user shall be able to filter activities by day of the week.

**FR-07**
Registered users whose profile already exists in the system shall be able to register for an activity through a registration button available in the personal area.

**FR-08**
New user profiles shall be created exclusively by authenticated administrators through the administration panel. The administrator shall provide the following fields when creating a new user profile:
- Identity number (required)
- Full name (required)
- Phone number (required)
- Email (required)

Visitors cannot self-register or create their own user profile through any public-facing form.

**FR-09**
After successful registration submission from the personal area, the system shall display a confirmation message in Hebrew.

Acceptance Criteria:
A confirmation message appears within 2 seconds after successful submission.

**FR-10**
The system shall prevent duplicate registrations for the same activity using the same phone number.

**FR-11**
The system shall disable registration when an activity reaches its participant limit.

**FR-12**
Activities that require payment shall display a link to an external payment system. The website does not process payments internally, does not store credit card details, and does not perform payment clearing. The payment link redirects the user to an external payment service only.

**FR-13**
The user shall be able to search activities using keywords.

Acceptance Criteria:
Searching for "Yoga" displays only activities containing the keyword in the title or description.

---

### User Profile – Administrator-Created Participant

**FR-39**
User profiles shall be created exclusively by authenticated administrators through the administration panel. When an administrator creates a new user profile, the system shall save the participant's personal details — identity number, full name, phone number, and email — as a user profile record linked to their phone number.

Acceptance Criteria:
After an administrator successfully creates a user profile, the participant's personal details are stored and retrievable by phone number. No public-facing form exists for users to self-register.

**FR-40**
On subsequent visits, when a returning user accesses the personal area using their full name and phone number, the system shall recognize them as an existing participant by looking up their stored user profile.

Acceptance Criteria:
A user whose full name and phone number match an existing administrator-created profile record is granted access to the personal area and their personal details are loaded automatically.

**FR-41**
When a returning user registers for an activity from within the personal area, the system shall use their stored personal details (identity number, full name, phone number, email) automatically. The user shall not be required to re-enter any personal information.

Acceptance Criteria:
Clicking the registration button for an activity from within the personal area creates a new registration record using the stored profile data, without presenting the user with a personal details form.

**FR-42**
Before completing a registration from the personal area, the system shall display a confirmation screen showing the activity details:
- Activity title
- Category
- Date
- Day of the week
- Time
- Number of available spots
- Whether the activity requires payment

If the activity requires payment, the confirmation screen shall display a link to the external payment system. The user must explicitly confirm before the registration is finalized.

Acceptance Criteria:
The confirmation screen appears after the user clicks the registration button and before the registration is saved. All seven detail fields are displayed. A payment link is shown when applicable.

**FR-43**
After a successful registration from the personal area, the newly registered activity shall appear immediately in the user's personal activity calendar within the personal area.

Acceptance Criteria:
The personal calendar is refreshed after registration and includes the newly added activity.

---

### Announcements

**FR-14**
The system shall provide a dedicated announcements page displaying all announcements sorted by publication date.

---

### Information Page

**FR-15**
The system shall display:
- Center address
- Opening hours
- Phone number
- Email address
- Embedded Google Map

---

### Contact Form

**FR-16**
The contact form shall collect:
- Name
- Email
- Subject
- Message

**FR-17**
Submitted contact requests shall be stored in the system and made available to authenticated administrators.

---

### Accessibility

**FR-18**
The website shall provide font size adjustment options.

**FR-19**
All interactive components shall be accessible using keyboard navigation only.

---

### Administration – Activities

**FR-20**
Authenticated administrators shall be able to create activities.

**FR-21**
Authenticated administrators shall be able to edit existing activities.

**FR-22**
Authenticated administrators shall be able to delete activities.

---

### Administration – Registrations

**FR-23**
Authenticated administrators shall be able to view all registrations. The registrations list shall include each participant's identity number, full name, phone number, and email, as well as the registered activity.

**FR-24**
Authenticated administrators shall be able to cancel registrations.

**FR-25**
Authenticated administrators shall be able to export registrations to CSV format. The export shall include the identity number field.

---

### Administration – User Profiles

**FR-46**
Authenticated administrators shall be able to create new user profiles by entering the participant's identity number, full name, phone number, and email. This is the only way a new user profile can be created in the system.

Acceptance Criteria:
After an administrator creates a user profile, the participant can immediately access the personal area using their full name and phone number.

**FR-47**
Authenticated administrators shall be able to view all existing user profiles, including identity number, full name, phone number, and email.

**FR-48**
Authenticated administrators shall be able to edit an existing user profile, for example to update an email address or correct a name.

Acceptance Criteria:
After saving edits, the updated details are reflected in the personal area and in any subsequent registrations from the personal area.

**FR-49**
Authenticated administrators shall be able to delete a user profile.

Acceptance Criteria:
After deletion, the participant can no longer access the personal area using their full name and phone number. Existing registration records linked to that profile are retained for historical purposes.

---

### Administration – Announcements

**FR-26**
Authenticated administrators shall be able to publish announcements.

**FR-27**
Authenticated administrators shall be able to edit announcements.

**FR-28**
Authenticated administrators shall be able to delete announcements.

---

### Administration – Media

**FR-29**
Authenticated administrators shall be able to upload images to the gallery.

**FR-30**
Authenticated administrators shall be able to remove images from the gallery.

---

### Administration – Center Information

**FR-31**
Authenticated administrators shall be able to edit center information including:
- Center name
- Address
- Phone number
- Email
- Opening hours
- About page content

Acceptance Criteria:
After saving changes, updated information appears on the public website.

---

### Authentication

**FR-32**
Administrators shall authenticate using username and password.

**FR-33**
Administrator sessions shall expire after 60 minutes of inactivity.

---

### Personal Area – Activity Calendar and Registration

**FR-34**
The system shall provide a personal area page where any visitor can enter their full name and phone number to access their personal area, provided their profile has been created by an administrator.

Acceptance Criteria:
A visitor who enters a full name and phone number that match an existing administrator-created user profile record is granted access to the personal area.

**FR-35**
When a visitor submits the personal area access form, the system shall first look up the stored user profile matching the provided full name and phone number combination. If a matching profile exists, the system shall load the user's registration records.

Acceptance Criteria:
Only a user profile where both the full name and phone number match exactly grants access. If no matching profile exists, the system displays an informative message in Hebrew.

**FR-36**
The personal area shall display a calendar containing all future activities the user is registered for, sorted by activity date in ascending order. Past activities shall not be displayed.

Acceptance Criteria:
A user registered for 5 activities, of which 3 are in the future and 2 are in the past, sees only the 3 future activities in the calendar.

**FR-37**
Each activity shown in the personal calendar shall display the activity title, category, date, day of the week, and time.

Acceptance Criteria:
Each calendar entry displays all five fields: title, category, date, day, and time.

**FR-38**
If no user profile is found for the entered full name and phone number combination, the system shall display an informative message in Hebrew indicating that no profile was found. The message shall suggest that the user contact the center to be registered in the system.

**FR-44**
The personal area shall display the list of available activities, allowing the recognized returning user to browse and register for additional activities without navigating away from the personal area.

Acceptance Criteria:
A list of active activities with available spots is visible within the personal area alongside the personal calendar.

**FR-45**
When a user initiates registration for an activity from within the personal area, the system shall use the stored profile data to complete the registration automatically, without requiring the user to re-enter their personal details. The system shall still enforce duplicate registration prevention (FR-10) and capacity limits (FR-11).

Acceptance Criteria:
A user already in the personal area can register for an activity by clicking a registration button, confirming the activity details (FR-42), and confirming without filling in any personal fields.

---

## Non-Functional Requirements (NFR)

### Performance

**NFR-01**
Public pages shall load within 3 seconds under normal internet conditions.

**NFR-02**
Registration submission from the personal area shall respond within 2 seconds.

**NFR-03**
The activities catalog shall display up to 200 activities within 1.5 seconds.

---

### Accessibility

**NFR-04**
The website shall comply with WCAG 2.1 Level AA accessibility requirements.

**NFR-05**
All non-decorative images shall include descriptive alt text.

**NFR-06**
Text contrast ratios shall meet WCAG AA standards.

---

### Usability

**NFR-07**
A user whose profile has been created by an administrator shall be able to locate and register for an activity from the personal area within 5 minutes.

**NFR-08**
All validation messages shall be written in clear and simple Hebrew.

---

### Compatibility

**NFR-09**
The website shall function correctly on Chrome, Firefox, Edge and Safari.

**NFR-10**
The website shall be responsive between 375px and 1920px screen widths.

**NFR-11**
The website shall support RTL (Right-to-Left) layout across all pages.

---

### Security

**NFR-12**
All traffic shall be transmitted using HTTPS.

**NFR-13**
All user inputs shall be validated and sanitized on the server side.

**NFR-14**
Administrator passwords shall be stored using bcrypt hashing.

**NFR-15**
Unauthorized access to administrator APIs shall return HTTP 401 responses.

---

### Reliability

**NFR-16**
Registration data shall be saved permanently in the database within 1 second after successful submission.

**NFR-17**
Registration data shall remain available after application restart.

---

### Maintainability

**NFR-18**
All source code shall be maintained in a Git repository.

**NFR-19**
The project shall include a README containing setup and deployment instructions.

---

### Scalability

**NFR-20**
The system shall support at least 50 concurrent users without significant degradation in response time.

---

### Privacy

**NFR-21**
Personal information collected and managed by the system shall not be shared with third parties without authorization.

Acceptance Criteria:
User data remains stored only within the system database unless explicitly required for system functionality.

**NFR-22**
The personal area lookup shall return only the stored profile and registrations belonging to the exact full name and phone number combination provided. No public account creation, password, session, or persistent login is created for participants.

**NFR-23**
The personal activity calendar shall load and display results within 2 seconds of form submission under normal internet conditions.

**NFR-24**
The system shall not store credit card details, payment credentials, or any financial data. Payment processing is handled exclusively by the external payment system.
