# Smart Attendance System (Face Recognition)

A full-stack smart attendance portal with:

- Next.js frontend (upload/camera, recognition UI, face box overlay)
- FastAPI backend endpoints (`/recognize`, `/enroll`)
- Student training workflow (multi-image enrollment + averaged embedding)

## Features

- Upload image or capture from webcam
- Send image to recognition API
- Show detected/recognized students and unknown count
- Draw scaled bounding boxes over detected faces
- Enroll students from frontend:
  - `Add Person & Train` panel
  - Student name + multiple images
  - Calls backend `POST /enroll`

## Frontend Stack

- Next.js (App Router)
- React (functional components)
- Tailwind CSS

## Project Structure

```text
/app
/components
/services
/utils
```

## API Contracts

### Recognize

`POST /recognize`

Request: multipart `image`

Response:

```json
{
  "faces_detected": 3,
  "recognized": [
    {
      "name": "Alden",
      "confidence": 92,
      "box": [120, 80, 140, 160]
    }
  ],
  "unknown_count": 1
}
```

### Enroll

`POST /enroll`

Request: multipart

- `name` (string)
- `images` (multiple files)

Response:

```json
{
  "message": "Enrollment successful",
  "valid_images": 7,
  "skipped_images": 2
}
```

## Environment Variables

Use `.env.local` for local secrets and `.env.example` as template.

Frontend API variables:

- `NEXT_PUBLIC_RECOGNIZE_URL` (default: `http://localhost:8000/recognize`)
- `NEXT_PUBLIC_ENROLL_URL` (default: `http://localhost:8000/enroll`)

Cloudinary variables already included in env templates:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_URL`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Run frontend:

```bash
npm run dev
```

3. Ensure FastAPI backend is running on port `8000` with `/recognize` and `/enroll`.

## Build & Lint

```bash
npm run lint
npm run build
```

## Notes

- `.env.local` is ignored by git.
- Enrollment button is integrated directly on the homepage.
- Frontend is designed to stay simple and modular for easy backend swaps.
