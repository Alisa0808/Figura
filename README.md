<div align="center">
  <img src="public/logo-horiz.svg" alt="Figura Logo" width="300"/>
</div>

# Figura | Impressionist Pose Generator

Figura is a web application that helps photographers, artists, and directors plan their shots. By uploading a reference image and specifying the number of male and female subjects, Figura uses advanced AI to overlay a clean, minimalist white line art sketch onto your scene, providing a perfect posing guide without altering the original background.

## Features

- **Image Upload:** Upload any reference photo or background scene.
- **Subject Specification:** Choose the exact number of male and female subjects you want in the scene.
- **AI-Powered Line Art:** Generates a non-intrusive, white line sketch of the subjects posing naturally in your environment.
- **Original Scene Preservation:** The AI is strictly instructed to preserve your original background and lighting, only adding the pose instructions.
- **Side-by-Side Comparison:** Compare your original image with the generated posing guide.
- **Download:** Save the generated posing guide directly to your device.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Lucide React
- **Backend:** Node.js, Express (API Proxy)
- **AI Models:** Atlas Cloud API
  - Nano Banana Pro (default)
  - Nano Banana 2 (alternative option)

## Prerequisites

- Node.js (v18 or higher recommended)
- An [Atlas Cloud API Key](https://www.atlascloud.ai/?utm_source=github&ref=F27PTG)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Alisa0808/Figura.git
   cd Figura
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add your Atlas Cloud API key:
   ```env
   ATLAS_API_KEY=your_atlas_api_key_here
   ```
   *(Note: You can also enter your API key directly in the app's UI via the settings menu at the bottom of the screen).*

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to `http://localhost:3000` in your browser.

## Usage

1. Click the upload area to select a background image.
2. Use the "+" and "-" buttons to set the desired number of male and female subjects.
3. Click **"Generate Posing Guide"**.
4. Wait for the AI to process the image.
5. View the result, compare it with the original, and click **"Download Guide"** to save it.

## License

This project is open-source and available under the MIT License.
