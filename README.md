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
 


## Postman Collection

[<img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style="width: 128px; height: 32px;">](https://god.gw.postman.com/run-collection/30722641-ebcc5844-d6b7-4ce6-bc73-d07ff06f1f3d?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D30722641-ebcc5844-d6b7-4ce6-bc73-d07ff06f1f3d%26entityType%3Dcollection%26workspaceId%3Ddab268f4-03ca-44b0-b588-eabd1d433d2c)




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

 ![Login Page](https://github.com/vaibhav1710/Pinterest-Clone/blob/master/Screenshots/Screenshot%20(306).png)

![User Profile](https://github.com/vaibhav1710/Pinterest-Clone/blob/master/Screenshots/Screenshot%20(307).png)

![View Post](https://github.com/vaibhav1710/Pinterest-Clone/blob/master/Screenshots/Screenshot%20(308).png)

Feel free to explore, upload images, and enjoy the Pinterest Clone experience!

---

**Note:** Replace placeholder values in the setup instructions with your actual credentials and configurations. The provided instructions assume basic familiarity with Node.js, npm, MongoDB, and AWS S3.
