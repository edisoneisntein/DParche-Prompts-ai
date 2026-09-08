package com.example.promptexpert.data.model

enum class ExpertMode(
    val id: String,
    val title: String,
    val subtitle: String,
    val iconName: String,
    val isElite: Boolean = false
) {
    GENERAL(
        id = "general",
        title = "Ingeniero General de Prompts",
        subtitle = "Industrial grade. Genera instrucciones estructuradas y robustas.",
        iconName = "Wand"
    ),
    DIRECT_ASSISTANT(
        id = "direct_assistant",
        title = "Asistente Directo AURA",
        subtitle = "Ejecuta de inmediato. Responde con soluciones reales y código sin rodeos.",
        iconName = "Sparkles"
    ),
    ADVERSARIAL_ARCHITECT(
        id = "adversarial_architect",
        title = "Arquitecto Adversarial V3",
        subtitle = "Auditoría destructiva, edge cases extremos y reconstrucción resiliente.",
        iconName = "Theater",
        isElite = true
    ),
    ARCHITECT_V3(
        id = "architect_v3",
        title = "Arquitecto Industrial V3",
        subtitle = "Estructura PART/PAE para entornos Enterprise y misión crítica.",
        iconName = "Brain",
        isElite = true
    ),
    CREATOR(
        id = "creator",
        title = "Creador de Software",
        subtitle = "Desarrollador de software de élite. SOLID, TS, Go y código de producción.",
        iconName = "Sparkles"
    ),
    AUDITOR_ELITE(
        id = "auditor_elite",
        title = "Auditor de Código Élite",
        subtitle = "Auditor de seguridad, SRE, OWASP y mitigación de fallos.",
        iconName = "Theater"
    ),
    LOOP_ENGINEER(
        id = "loop_engineer",
        title = "Loop Engineer 🔄",
        subtitle = "Bucle de autoevaluación, refinamiento continuo y optimización.",
        iconName = "Brain"
    ),
    MEDIA_ANALYZER(
        id = "media_analyzer",
        title = "Analizador Multimedia",
        subtitle = "Análisis profundo de video, audio, secuencias visuales y documentos.",
        iconName = "Sparkles"
    ),
    PROMPT_AUGMENTER(
        id = "prompt_augmenter",
        title = "Potenciador de Prompts",
        subtitle = "Motor de refinamiento y mutación de prompts.",
        iconName = "Wand"
    ),
    PROMPT_CHAINER(
        id = "prompt_chainer",
        title = "Encadenador de Continuidad",
        subtitle = "Motor de multi-turn prompt engineering.",
        iconName = "Brain"
    ),
    APP_AUDITOR(
        id = "app_auditor",
        title = "Auditor de Aplicación",
        subtitle = "Auditoría de arquitectura y seguridad del sistema.",
        iconName = "Theater"
    );

    companion object {
        val selectableModes = listOf(
            GENERAL,
            DIRECT_ASSISTANT,
            ADVERSARIAL_ARCHITECT,
            ARCHITECT_V3,
            CREATOR,
            AUDITOR_ELITE,
            LOOP_ENGINEER,
            MEDIA_ANALYZER
        )

        fun fromId(id: String): ExpertMode {
            return entries.firstOrNull { it.id == id } ?: GENERAL
        }
    }
}
