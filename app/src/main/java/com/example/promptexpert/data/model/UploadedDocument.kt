package com.example.promptexpert.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UploadedDocument(
    val name: String,
    val content: String,
    val size: Long = 0,
    val type: String = "text/plain"
) {
    val isMedia: Boolean
        get() = type.startsWith("image/") || type.startsWith("video/") || type.startsWith("audio/")

    val formattedSize: String
        get() {
            return when {
                size < 1024 -> "$size B"
                size < 1024 * 1024 -> "${size / 1024} KB"
                else -> String.format("%.1f MB", size / (1024.0 * 1024.0))
            }
        }
}
