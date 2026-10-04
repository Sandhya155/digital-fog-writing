import cv2
import numpy as np
import tensorflow as tf

MODEL_PATH = "blowing_model.keras"
IMAGE_SIZE = (128, 128)

print("Loading model...")

model = tf.keras.models.load_model(MODEL_PATH)

print("Model loaded successfully.")
print()
print("Starting camera...")
print("Blow toward the camera.")
print("Press Q to quit.")

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("ERROR: Could not open camera.")
    exit()

while True:

    ret, frame = cap.read()

    if not ret:
        print("ERROR: Could not read camera.")
        break

    # Resize frame
    image = cv2.resize(frame, IMAGE_SIZE)

    # Convert BGR → RGB
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Convert to numbers between 0 and 1
    image = image.astype("float32") / 255.0

    # Add batch dimension
    image = np.expand_dims(image, axis=0)

    # Prediction
    prediction = model.predict(image, verbose=0)[0][0]

    # Our folders are alphabetically ordered:
    # blowing = 0
    # not_blowing = 1
    if prediction < 0.5:
        label = "BLOWING"
        confidence = (1 - prediction) * 100
    else:
        label = "NOT BLOWING"
        confidence = prediction * 100

    # Display result
    cv2.putText(
        frame,
        f"{label}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    cv2.putText(
        frame,
        f"Confidence: {confidence:.2f}%",
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 0),
        2
    )

    cv2.imshow("Blow Detection Test", frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()

print()
print("Test finished.")