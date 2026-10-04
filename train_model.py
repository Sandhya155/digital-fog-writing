import tensorflow as tf
from tensorflow.keras import layers, models
import matplotlib.pyplot as plt

# ==========================================
# SETTINGS
# ==========================================

DATASET_PATH = "dataset"

IMAGE_SIZE = (128, 128)
BATCH_SIZE = 32
EPOCHS = 20

# ==========================================
# LOAD TRAINING DATA
# ==========================================

print("Loading training dataset...")

train_dataset = tf.keras.utils.image_dataset_from_directory(
    DATASET_PATH,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    validation_split=0.2,
    subset="training",
    seed=123
)

# ==========================================
# LOAD VALIDATION DATA
# ==========================================

print("Loading validation dataset...")

validation_dataset = tf.keras.utils.image_dataset_from_directory(
    DATASET_PATH,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    validation_split=0.2,
    subset="validation",
    seed=123
)

# ==========================================
# SHOW CLASS NAMES
# ==========================================

class_names = train_dataset.class_names

print()
print("Classes detected:")
print(class_names)

# ==========================================
# NORMALIZE IMAGES
# ==========================================

normalization_layer = layers.Rescaling(1.0 / 255)

train_dataset = train_dataset.map(
    lambda x, y: (
        normalization_layer(x),
        y
    )
)

validation_dataset = validation_dataset.map(
    lambda x, y: (
        normalization_layer(x),
        y
    )
)

# ==========================================
# CREATE CNN MODEL
# ==========================================

print()
print("Creating CNN model...")

model = models.Sequential([

    layers.Input(
        shape=(128, 128, 3)
    ),

    # First convolution layer
    layers.Conv2D(
        32,
        (3, 3),
        activation="relu"
    ),

    layers.MaxPooling2D(),

    # Second convolution layer
    layers.Conv2D(
        64,
        (3, 3),
        activation="relu"
    ),

    layers.MaxPooling2D(),

    # Third convolution layer
    layers.Conv2D(
        128,
        (3, 3),
        activation="relu"
    ),

    layers.MaxPooling2D(),

    # Convert feature maps to one-dimensional
    layers.Flatten(),

    # Fully connected layer
    layers.Dense(
        128,
        activation="relu"
    ),

    # Prevent overfitting
    layers.Dropout(0.5),

    # Binary classification
    layers.Dense(
        1,
        activation="sigmoid"
    )
])

# ==========================================
# COMPILE MODEL
# ==========================================

model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

# ==========================================
# SHOW MODEL
# ==========================================

print()
print("Model structure:")
model.summary()

# ==========================================
# TRAIN MODEL
# ==========================================

print()
print("==========================================")
print("       STARTING MODEL TRAINING")
print("==========================================")
print()

history = model.fit(
    train_dataset,
    validation_data=validation_dataset,
    epochs=EPOCHS
)

# ==========================================
# SAVE MODEL
# ==========================================

model.save(
    "blowing_model.keras"
)

print()
print("==========================================")
print("MODEL TRAINING COMPLETED")
print("==========================================")
print()
print("Model saved as:")
print("blowing_model.keras")

# ==========================================
# PLOT ACCURACY
# ==========================================

plt.figure()

plt.plot(
    history.history["accuracy"],
    label="Training Accuracy"
)

plt.plot(
    history.history["val_accuracy"],
    label="Validation Accuracy"
)

plt.xlabel("Epoch")
plt.ylabel("Accuracy")

plt.title(
    "Training vs Validation Accuracy"
)

plt.legend()

plt.show()