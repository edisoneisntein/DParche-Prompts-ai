package com.example.promptexpert.data.database

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "prompt_cache",
    indices = [Index(value = ["cacheKey"], unique = true)]
)
data class PromptCacheEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val cacheKey: String,
    val idea: String,
    val mode: String,
    val result: String,
    val timestamp: Long = System.currentTimeMillis()
)
