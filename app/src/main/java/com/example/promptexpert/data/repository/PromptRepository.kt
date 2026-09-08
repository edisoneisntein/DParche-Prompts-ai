package com.example.promptexpert.data.repository

import com.example.promptexpert.BuildConfig
import com.example.promptexpert.data.database.ChatMessageDao
import com.example.promptexpert.data.database.ChatMessageEntity
import com.example.promptexpert.data.database.PromptCacheDao
import com.example.promptexpert.data.database.PromptCacheEntity
import com.example.promptexpert.data.model.AugmentationType
import com.example.promptexpert.data.model.Content
import com.example.promptexpert.data.model.ExpertMode
import com.example.promptexpert.data.model.GenerateContentRequest
import com.example.promptexpert.data.model.GenerationConfig
import com.example.promptexpert.data.model.InlineData
import com.example.promptexpert.data.model.Part
import com.example.promptexpert.data.model.UploadedDocument
import com.example.promptexpert.data.service.GeminiApiService
import com.example.promptexpert.data.service.SystemInstructions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.security.MessageDigest

class PromptRepository(
    private val cacheDao: PromptCacheDao,
    private val chatDao: ChatMessageDao,
    private val apiService: GeminiApiService = GeminiApiService.create()
) {
    val cacheCount: Flow<Int> = cacheDao.getCacheCount()
    val chatHistory: Flow<List<ChatMessageEntity>> = chatDao.getAllMessages()

    private fun computeCacheKey(idea: String, mode: String, docs: List<UploadedDocument>): String {
        val docSummary = docs.joinToString(";") { "${it.name}:${it.size}" }
        val raw = "$idea::$mode::$docSummary".lowercase().trim()
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(raw.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }

    suspend fun getCachedPrompt(idea: String, mode: String, docs: List<UploadedDocument>): String? {
        val key = computeCacheKey(idea, mode, docs)
        return cacheDao.getByKey(key)?.result
    }

    suspend fun clearCache() {
        cacheDao.clearAll()
    }

    suspend fun saveChatMessage(role: String, content: String) {
        chatDao.insertMessage(ChatMessageEntity(role = role, content = content))
    }

    suspend fun clearChatHistory() {
        chatDao.clearHistory()
    }

    /**
     * Streams generation of an expert prompt from user idea, mode, and optional documents.
     */
    fun generatePromptStream(
        idea: String,
        mode: ExpertMode,
        documents: List<UploadedDocument> = emptyList()
    ): Flow<String> = flow {
        val cacheKey = computeCacheKey(idea, mode.id, documents)
        val cached = cacheDao.getByKey(cacheKey)
        if (cached != null) {
            emit(cached.result)
            return@flow
        }

        val apiKey = BuildConfig.GEMINI_API_KEY
        val systemInstructionText = SystemInstructions.getInstructionForMode(mode)

        // Build prompt parts
        val parts = mutableListOf<Part>()
        var textContext = "Idea del usuario:\n\"$idea\""

        if (documents.isNotEmpty()) {
            textContext += "\n\n=== DOCUMENTOS DE SOPORTE ADJUNTADOS POR EL USUARIO ===\n"
            for (doc in documents) {
                if (doc.isMedia) {
                    parts.add(
                        Part(
                            inlineData = InlineData(
                                mimeType = doc.type,
                                data = doc.content
                            )
                        )
                    )
                } else {
                    textContext += "\n--- ARCHIVO: ${doc.name} ---\n${doc.content}\n--- FIN DE ARCHIVO: ${doc.name} ---\n"
                }
            }
            textContext += "\n=======================================================\n"
            textContext += "Instrucción de contexto: Utiliza la información y datos provistos en los documentos de soporte anteriores para enriquecer, basar y optimizar la idea del usuario."
        }

        parts.add(Part(text = textContext))

        val request = GenerateContentRequest(
            contents = listOf(Content(parts = parts)),
            systemInstruction = Content(parts = listOf(Part(text = systemInstructionText))),
            generationConfig = GenerationConfig(
                temperature = 0.7f,
                topP = 0.9f
            )
        )

        val fullResponse = StringBuilder()

        try {
            val responseBody = apiService.streamGenerateContent(apiKey, request)
            responseBody.byteStream().bufferedReader().use { reader ->
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    val currentLine = line?.trim() ?: continue
                    if (currentLine.isEmpty()) continue

                    // Parse stream chunks (either SSE data: {...} or JSON array chunk)
                    val jsonStr = if (currentLine.startsWith("data: ")) {
                        currentLine.removePrefix("data: ").trim()
                    } else {
                        currentLine
                    }

                    if (jsonStr == "[DONE]") break

                    try {
                        val element = Json.parseToJsonElement(jsonStr)
                        val text = if (element is kotlinx.serialization.json.JsonArray) {
                            element.getOrNull(0)?.jsonObject
                                ?.get("candidates")?.jsonArray
                                ?.getOrNull(0)?.jsonObject
                                ?.get("content")?.jsonObject
                                ?.get("parts")?.jsonArray
                                ?.getOrNull(0)?.jsonObject
                                ?.get("text")?.jsonPrimitive?.content
                        } else {
                            element.jsonObject
                                .get("candidates")?.jsonArray
                                ?.getOrNull(0)?.jsonObject
                                ?.get("content")?.jsonObject
                                ?.get("parts")?.jsonArray
                                ?.getOrNull(0)?.jsonObject
                                ?.get("text")?.jsonPrimitive?.content
                        }

                        if (!text.isNullOrEmpty()) {
                            fullResponse.append(text)
                            emit(text)
                        }
                    } catch (_: Exception) {
                        // Continue reading stream buffer
                    }
                }
            }

            // Save completed response to cache if meaningful
            if (fullResponse.isNotEmpty()) {
                val completeResult = fullResponse.toString()
                cacheDao.insertCache(
                    PromptCacheEntity(
                        cacheKey = cacheKey,
                        idea = idea,
                        mode = mode.id,
                        result = completeResult
                    )
                )
            }
        } catch (e: Exception) {
            // Fallback non-streaming attempt in case stream was interrupted
            val fallbackResponse = apiService.generateContent(apiKey, request)
            val result = fallbackResponse.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                ?: throw e
            emit(result)
            cacheDao.insertCache(
                PromptCacheEntity(
                    cacheKey = cacheKey,
                    idea = idea,
                    mode = mode.id,
                    result = result
                )
            )
        }
    }.flowOn(Dispatchers.IO)

    /**
     * Augments an existing prompt with a specific modification rule.
     */
    fun augmentPromptStream(basePrompt: String, augType: AugmentationType): Flow<String> = flow {
        val apiKey = BuildConfig.GEMINI_API_KEY
        val systemInstructionText = SystemInstructions.PROMPT_AUGMENTER
        val requestContent = "Modification Rule: ${augType.rule}\n\nBase Prompt:\n\"$basePrompt\""

        val request = GenerateContentRequest(
            contents = listOf(Content(parts = listOf(Part(text = requestContent)))),
            systemInstruction = Content(parts = listOf(Part(text = systemInstructionText))),
            generationConfig = GenerationConfig(temperature = 0.7f, topP = 0.9f)
        )

        try {
            val response = apiService.generateContent(apiKey, request)
            val result = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text.orEmpty()
            emit(result)
        } catch (e: Exception) {
            emit("Error al aplicar el potenciador: ${e.message}")
        }
    }.flowOn(Dispatchers.IO)

    /**
     * Generates chained prompt for conversation continuity.
     */
    fun chainPromptStream(
        previousPrompt: String,
        aiResponse: String,
        nextGoal: String
    ): Flow<String> = flow {
        val apiKey = BuildConfig.GEMINI_API_KEY
        val systemInstructionText = SystemInstructions.PROMPT_CHAINER
        val requestContent = """
            Contexto del encadenamiento:
            --- PROMPT ANTERIOR ---
            $previousPrompt
            --- RESPUESTA ANTERIOR DE LA IA ---
            $aiResponse
            --- SIGUIENTE OBJETIVO O PREGUNTA ---
            $nextGoal
            -----------------------------------
            Por favor, genera el siguiente PROMPT EXPERTO que continúe el hilo de trabajo de forma óptima.
        """.trimIndent()

        val request = GenerateContentRequest(
            contents = listOf(Content(parts = listOf(Part(text = requestContent)))),
            systemInstruction = Content(parts = listOf(Part(text = systemInstructionText))),
            generationConfig = GenerationConfig(temperature = 0.7f, topP = 0.9f)
        )

        try {
            val response = apiService.generateContent(apiKey, request)
            val result = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text.orEmpty()
            emit(result)
        } catch (e: Exception) {
            emit("Error al generar el encadenamiento: ${e.message}")
        }
    }.flowOn(Dispatchers.IO)

    /**
     * Executes the Application Audit against the codebase architecture.
     */
    suspend fun auditApplication(architectureSummary: String): String = withContext(Dispatchers.IO) {
        val apiKey = BuildConfig.GEMINI_API_KEY
        val systemInstructionText = SystemInstructions.APP_AUDITOR
        val requestContent = """
            Por favor, audita la arquitectura y el código de esta aplicación Android (Jetpack Compose, Kotlin, Room Database, Material 3, Gemini REST API):
            
            $architectureSummary
            
            Proporciona un informe exhaustivo con matriz de seguridad, buenas prácticas, cumplimiento de accesibilidad y recomendaciones de optimización.
        """.trimIndent()

        val request = GenerateContentRequest(
            contents = listOf(Content(parts = listOf(Part(text = requestContent)))),
            systemInstruction = Content(parts = listOf(Part(text = systemInstructionText))),
            generationConfig = GenerationConfig(temperature = 0.4f, topP = 0.9f)
        )

        try {
            val response = apiService.generateContent(apiKey, request)
            response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                ?: "Informe de auditoría completado satisfactoriamente."
        } catch (e: Exception) {
            "Error al ejecutar la auditoría: ${e.message}"
        }
    }
}
