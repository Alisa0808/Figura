import fs from 'fs';

async function test() {
  try {
    const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/nano-banana-pro/edit',
        prompt: "A beautiful sunset over the ocean",
        images: [dummyBase64],
        aspect_ratio: "1:1",
        resolution: "1k",
        enable_base64_output: true,
        enable_sync_mode: true
      })
    });
    const result = await response.json();
    console.log("Result:", JSON.stringify(result, null, 2).substring(0, 1000));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
