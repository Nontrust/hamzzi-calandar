## ADDED Requirements

### Requirement: App shell hero context must be consistent
The system MUST render a top hero description block on home, anniversaries, schedule, and settings pages.

#### Scenario: Page hero is shown
- **WHEN** a user opens one of the four main pages
- **THEN** the system shows a page-specific hero title and summary text at the top

### Requirement: Account popup must expose user context and action
The system MUST show user name, login id, role label, and logout action when the account badge is clicked.

#### Scenario: Account popup opens
- **WHEN** a user clicks the account badge in the header
- **THEN** the system displays a popup with name, login id, role label, and a logout button

### Requirement: Account popup layering must stay above content
The system MUST keep the account popup visible above page content cards.

#### Scenario: Popup overlaps content
- **WHEN** the popup is open while content cards are rendered below
- **THEN** the popup remains visually above the content