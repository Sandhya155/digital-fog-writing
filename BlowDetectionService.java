package com.example.blowdetection.service;

import ai.onnxruntime.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.nio.FloatBuffer;
import java.util.Map;

@Service
public class BlowDetectionService {

    private final OrtEnvironment environment;
    private final OrtSession session;
    private final String inputName;

    public BlowDetectionService() throws Exception {

        // Create ONNX Runtime environment
        environment = OrtEnvironment.getEnvironment();

        // Load ONNX model from resources/models
        ClassPathResource resource =
                new ClassPathResource("models/blowing_model.onnx");

        byte[] modelBytes;

        try (InputStream inputStream = resource.getInputStream()) {
            modelBytes = inputStream.readAllBytes();
        }

        // Create ONNX session
        OrtSession.SessionOptions options =
                new OrtSession.SessionOptions();

        session = environment.createSession(modelBytes, options);

        // Get model input name automatically
        inputName = session.getInputNames().iterator().next();

        System.out.println("ONNX model loaded successfully!");
        System.out.println("Model input: " + inputName);
    }

    public float predict(BufferedImage originalImage) throws Exception {

        // Resize image to 128 x 128
        BufferedImage image =
                new BufferedImage(128, 128, BufferedImage.TYPE_INT_RGB);

        Graphics2D graphics = image.createGraphics();

        graphics.drawImage(
                originalImage,
                0,
                0,
                128,
                128,
                null
        );

        graphics.dispose();

        // Create input array
        float[] inputData = new float[128 * 128 * 3];

        int index = 0;

        // Convert image pixels to RGB values
        // and normalize from 0-255 to 0-1
        for (int y = 0; y < 128; y++) {

            for (int x = 0; x < 128; x++) {

                int rgb = image.getRGB(x, y);

                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                inputData[index++] = r / 255.0f;
                inputData[index++] = g / 255.0f;
                inputData[index++] = b / 255.0f;
            }
        }

        // Model expects:
        // [1, 128, 128, 3]
        long[] shape = {1, 128, 128, 3};

        try (OnnxTensor tensor =
                     OnnxTensor.createTensor(
                             environment,
                             FloatBuffer.wrap(inputData),
                             shape
                     );

             OrtSession.Result result =
                     session.run(Map.of(inputName, tensor))) {

            Object output = result.get(0).getValue();

            // Most likely output format: float[][]
            if (output instanceof float[][]) {

                float[][] values = (float[][]) output;

                return values[0][0];
            }

            // Backup in case output is float[]
            if (output instanceof float[]) {

                float[] values = (float[]) output;

                return values[0];
            }

            throw new IllegalStateException(
                    "Unexpected model output type: "
                            + output.getClass()
            );
        }
    }

    public boolean isBlowing(BufferedImage image) throws Exception {

        float prediction = predict(image);

        // IMPORTANT:
        // Our model uses:
        // 0 = blowing
        // 1 = not blowing
        //
        // Therefore:
        // prediction < 0.5 -> BLOWING
        // prediction >= 0.5 -> NOT BLOWING

        return prediction < 0.5f;
    }
}