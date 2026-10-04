package com.example.blowdetection.controller;

import com.example.blowdetection.service.BlowDetectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.util.Map;

@RestController
@RequestMapping("/api/ml")
public class BlowDetectionController {

    private final BlowDetectionService blowDetectionService;

    public BlowDetectionController(
            BlowDetectionService blowDetectionService) {

        this.blowDetectionService = blowDetectionService;
    }

    @PostMapping(
            value = "/detect",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public Map<String, Object> detect(
            @RequestParam("frame") MultipartFile frame) {

        try {

            // Convert uploaded image into BufferedImage
            BufferedImage image =
                    ImageIO.read(frame.getInputStream());

            if (image == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid image"
                );
            }

            // Send image to ML model
            float prediction =
                    blowDetectionService.predict(image);

            // Our model:
            // < 0.5  = BLOWING
            // >= 0.5 = NOT BLOWING

            boolean blowing = prediction < 0.5f;

            String label;

            if (blowing) {
                label = "BLOWING";
            } else {
                label = "NOT BLOWING";
            }

            // Confidence
            float confidence;

            if (blowing) {
                confidence = (1 - prediction) * 100;
            } else {
                confidence = prediction * 100;
            }

            return Map.of(
                    "label", label,
                    "blowing", blowing,
                    "confidence", confidence
            );

        } catch (ResponseStatusException e) {

            throw e;

        } catch (Exception e) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "ML prediction failed",
                    e
            );
        }
    }
}
