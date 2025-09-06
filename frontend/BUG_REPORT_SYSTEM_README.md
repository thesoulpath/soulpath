# Bug Report System

A comprehensive bug reporting system with screenshot capture and annotation capabilities.

## Features

- **Screenshot Capture**: Capture the current screen or specific window
- **Annotation Tools**: 
  - Drawing tool with customizable colors and stroke width
  - Text tool with customizable font size and colors
  - Color palette with 12 predefined colors
  - Clear annotations functionality
- **Form Fields**: Title, description, category, and priority selection
- **Submitter Information**: Automatic capture of user details and submission timestamp
- **Database Storage**: All data is stored in the database with proper relationships
- **Admin Management**: Comprehensive admin interface for managing bug reports

## Usage

### Basic Usage

```tsx
import { BugReportSystem } from '@/components/BugReportSystem';

function MyComponent() {
  return (
    <div>
      <BugReportSystem />
    </div>
  );
}
```

### Custom Trigger Button

```tsx
import { BugReportTrigger } from '@/components/BugReportTrigger';

function MyComponent() {
  return (
    <div>
      <BugReportTrigger variant="primary" size="lg">
        Report an Issue
      </BugReportTrigger>
    </div>
  );
}
```

### Render Prop Pattern

```tsx
import { BugReportSystem } from '@/components/BugReportSystem';

function MyComponent() {
  return (
    <BugReportSystem>
      {({ openReport }) => (
        <button onClick={openReport}>
          Custom Bug Report Button
        </button>
      )}
    </BugReportSystem>
  );
}
```

## Database Schema

The bug reports are stored in the `bug_reports` table with the following structure:

```sql
- id: UUID (Primary Key)
- title: VARCHAR(255) (Required)
- description: TEXT (Required)
- screenshot: TEXT (Optional - Base64 encoded image)
- annotations: JSON (Optional - Annotation data)
- status: ENUM (OPEN, IN_PROGRESS, RESOLVED, CLOSED, ARCHIVED)
- priority: ENUM (LOW, MEDIUM, HIGH, CRITICAL)
- category: VARCHAR(100) (Optional)
- reporterId: UUID (Foreign Key to profiles table)
- assignedTo: UUID (Foreign Key to profiles table)
- createdAt: TIMESTAMP (Submission timestamp)
- updatedAt: TIMESTAMP
- resolvedAt: TIMESTAMP (Optional)
- archivedAt: TIMESTAMP (Optional)
```

### User Information

The system automatically captures and stores:
- **Reporter Details**: Full name, email, and user ID from the authenticated user
- **Submission Timestamp**: Exact time when the bug report was submitted
- **Annotations**: All drawing and text annotations with their metadata

## API Endpoint

### POST /api/bug-reports

Creates a new bug report.

**Request Body:**
```json
{
  "title": "Bug title",
  "description": "Detailed description",
  "category": "UI/UX",
  "priority": "MEDIUM",
  "screenshot": "data:image/png;base64,...",
  "annotations": [
    {
      "id": "123",
      "type": "drawing",
      "points": [{"x": 100, "y": 100}, {"x": 200, "y": 200}],
      "color": "#ff0000",
      "strokeWidth": 3,
      "fontSize": 16
    }
  ],
  "submitterDetails": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "userId": "user-uuid"
  },
  "submittedAt": "2024-01-15T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "bugReport": {
    "id": "uuid",
    "title": "Bug title",
    "description": "Detailed description",
    // ... other fields
  },
  "message": "Bug report submitted successfully"
}
```

## Annotation Data Structure

Annotations are stored as JSON with the following structure:

```typescript
interface Annotation {
  id: string;
  type: 'drawing' | 'text';
  points?: { x: number; y: number }[]; // For drawing annotations
  text?: string; // For text annotations
  textPosition?: { x: number; y: number }; // For text annotations
  color: string; // Hex color code
  strokeWidth: number; // For drawing annotations
  fontSize: number; // For text annotations
}
```

## Color Palette

The system includes 12 predefined colors:
- Red: #ff0000, #ff6b6b
- Orange: #ffa500
- Yellow: #ffff00
- Green: #00ff00
- Cyan: #00ffff
- Blue: #0000ff
- Magenta: #ff00ff
- White: #ffffff
- Black: #000000
- Gray: #808080
- Light Gray: #c0c0c0

## Browser Compatibility

- **Screenshot Capture**: Requires HTTPS and user permission
- **Canvas Drawing**: Modern browsers with Canvas API support
- **File Upload**: Modern browsers with File API support

## Security Considerations

- All API endpoints require authentication
- Screenshots are stored as base64 strings (consider file storage for production)
- Input validation is performed on both client and server
- Row-level security is implemented in the database

## Future Enhancements

- File upload for additional attachments
- Email notifications for new bug reports
- Integration with issue tracking systems
- Advanced annotation tools (shapes, arrows, etc.)
- Screenshot history and versioning
