import tensorflow as tf
import os

MODEL_PATH = "blowing_model.keras"
SAVED_MODEL_PATH = "saved_model"

print("Loading Keras model...")

model = tf.keras.models.load_model(MODEL_PATH)

print("Model loaded successfully.")

print("Exporting model to TensorFlow SavedModel format...")

if os.path.exists(SAVED_MODEL_PATH):
    import shutil
    shutil.rmtree(SAVED_MODEL_PATH)

model.export(SAVED_MODEL_PATH)

print()
print("====================================")
print("SAVEDMODEL EXPORT COMPLETED")
print("====================================")
print()
print("Saved to:")
print(SAVED_MODEL_PATH)