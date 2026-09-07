# Student Results API

A Node.js REST API that stores students, subjects, and marks in MySQL, then generates subject-wise results, overall results, and a class summary.

## Setup

Requirements: Node.js 18+ and MySQL 8+.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set the MySQL credentials.
3. Create the database and tables by running `schema.sql` in MySQL.
4. Start the API with `npm start` or use `npm run dev` during development.

The value `DB_PASSWORD=your_password` in `.env` is only a placeholder. Replace it with the actual password for your local MySQL `root` user before saving marks. If your root user has no password, use `DB_PASSWORD=`.

Open `http://localhost:3000` to use the browser test console. It lets you add students and marks, view an individual result, and load the class summary.

## Endpoints

### Create a student and marks

`POST /api/students`

```json
{
	"name": "Asha Kumar",
	"email": "asha@example.com",
	"subjects": [
		{ "name": "Mathematics", "mark": 88 },
		{ "name": "Science", "mark": 76 },
		{ "name": "English", "mark": 64 }
	]
}
```

Marks must be numeric values from 0 to 100. A student passes only when every subject mark is at least 40.

### Retrieve one student's complete result

`GET /api/students/:id/result`

Returns every subject mark, total, average, percentage, grade, pass/fail status, and highest/lowest subject marks. Missing students return `404`.

### Retrieve the class summary

`GET /api/summary`

Returns total students, passed students, failed students, highest scorer, and average class percentage. Students without marks are excluded from calculated results.

### Health check

`GET /health`

## Grade scale

| Average | Grade |
| --- | --- |
| 80-100 | A |
| 70-79 | B |
| 60-69 | C |
| 50-59 | D |
| Below 50 | F |

Run the calculation tests with `npm test`; these do not require MySQL.