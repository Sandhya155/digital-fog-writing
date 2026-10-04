import cv2
import os

# ==========================================
# SETTINGS
# ==========================================

LABEL = "not_blowing"

MAX_IMAGES = 500

SAVE_DIR = os.path.join(
    "dataset",
    LABEL
)

# Create the folder if it doesn't exist
os.makedirs(SAVE_DIR, exist_ok=True)

# ==========================================
# START CAMERA
# ==========================================

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("ERROR: Could not open camera.")
    exit()

print()
print("====================================")
print("     BLOWING DATASET COLLECTION")
print("====================================")
print()
print("Camera started.")
print()
print("Press SPACE -> Capture image")
print("Press Q     -> Quit")
print()

count = 0

# ==========================================
# CAMERA LOOP
# ==========================================

while True:

    ret, frame = cap.read()

    if not ret:
        print("ERROR: Could not read camera.")
        break

    display = frame.copy()

    cv2.putText(
        display,
        f"{LABEL}: {count}/{MAX_IMAGES}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    cv2.putText(
        display,
        "SPACE = Capture | Q = Quit",
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 0),
        2
    )

    cv2.imshow(
        "Dataset Collection",
        display
    )

    # ======================================
    # KEYBOARD INPUT
    # ======================================

    key = cv2.waitKey(1) & 0xFF

    # SPACE
    if key == 32:

        filename = os.path.join(
            SAVE_DIR,
            f"{LABEL}_{count:04d}.jpg"
        )

        cv2.imwrite(
            filename,
            frame
        )

        count += 1

        print(
            f"Image {count} saved: {filename}"
        )

        if count >= MAX_IMAGES:
            print()
            print("500 images collected!")
            break

    # Q
    elif key == ord("q"):
        print("Collection stopped.")
        break


# ==========================================
# CLEANUP
# ==========================================

cap.release()
cv2.destroyAllWindows()

print()
print("Dataset collection finished.")