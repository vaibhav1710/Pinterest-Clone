# Pinterest Clone

## Application Overview

- **Description:**
  - Replicates core functionalities of Pinterest.
  - Users can create accounts and perform various actions related to image posting.
  - AWS S3 is used for secure storage of uploaded images.

- **Key Features:**
  - User account creation.
  - Image upload, view, and delete functionalities.
  - Explore and view posts uploaded by other users.


## Setup Instructions

Follow these steps to set up and run the Pinterest Clone locally:

### Prerequisites

- Node.js and npm installed on your machine.
- MongoDB installed and running.
- AWS S3 credentials for storage.

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/pinterest-clone.git
    cd pinterest-clone
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up environment variables:**

    Create a `.env` file in the root directory and add the following variables:

    ```plaintext
    PORT=3000
    MONGODB_URI=your_mongodb_connection_string
    BUCKET_NAME=your_aws_s3_bucket_name
    BUCKET_REGION=your_aws_s3_bucket_region
    ACCESS_KEY=your_aws_access_key
    SECRET_KEY=your_aws_secret_key
    ```

    Replace the placeholders with your actual MongoDB connection string, AWS S3 bucket details, and credentials.

4. **Run the application:**

    ```bash
    npm start
    ```

    The application should be accessible at `http://localhost:3000`.

## Tech Stack

- Node.js and Express for the backend.
- MongoDB for database storage.
- AWS S3 for secure image storage.
- Passport.js for user authentication.
- EJS for server-side templating.

## Application Screenshots

Here are a few screenshots of the Pinterest Clone:

 ![Home Page](screenshots/home.png)

![User Profile](screenshots/profile.png)

![Upload Page](screenshots/upload.png)

Feel free to explore, upload images, and enjoy the Pinterest Clone experience!

---

**Note:** Replace placeholder values in the setup instructions with your actual credentials and configurations. The provided instructions assume basic familiarity with Node.js, npm, MongoDB, and AWS S3.
