package com.example.promptexpert

import android.app.Application
import com.example.promptexpert.data.database.AppDatabase

class PromptExpertApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Pre-warm database instance
        AppDatabase.getInstance(this)
    }
}
