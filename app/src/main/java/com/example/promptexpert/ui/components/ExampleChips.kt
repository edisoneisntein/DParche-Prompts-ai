package com.example.promptexpert.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.promptexpert.data.model.ExpertMode
import com.example.promptexpert.ui.theme.*

data class ExampleIdea(
    val label: String,
    val prompt: String,
    val mode: ExpertMode
)

val defaultExamples = listOf(
    ExampleIdea(
        label = "Plan de marketing",
        prompt = "Crear un plan de marketing para una nueva cafetería de especialidad",
        mode = ExpertMode.GENERAL
    ),
    ExampleIdea(
        label = "Explicar tema complejo",
        prompt = "Explicar la computación cuántica a un niño de 10 años utilizando analogías cotidianas",
        mode = ExpertMode.GENERAL
    ),
    ExampleIdea(
        label = "Componente de login",
        prompt = "Crear un componente de formulario de login con Jetpack Compose y Kotlin, incluyendo validación de email, estado de carga y accesibilidad completa.",
        mode = ExpertMode.CREATOR
    ),
    ExampleIdea(
        label = "Auditar inyecciones SQL",
        prompt = "Auditar una base de código para encontrar vulnerabilidades de inyección SQL y proponer soluciones con consultas parametrizadas.",
        mode = ExpertMode.AUDITOR_ELITE
    ),
    ExampleIdea(
        label = "Plan de Acción V3 (Enterprise)",
        prompt = "Remediación técnica de vulnerabilidades críticas, fugas de secretos y condiciones de carrera (race conditions) en una plataforma de trading financiero de alta frecuencia.",
        mode = ExpertMode.ARCHITECT_V3
    ),
    ExampleIdea(
        label = "Bucle de Calidad 🔄",
        prompt = "Diseñar un sistema de recomendación que ejecute bucles iterativos de auto-evaluación, detección de sesgos y refinamiento continuo.",
        mode = ExpertMode.LOOP_ENGINEER
    ),
    ExampleIdea(
        label = "Inducción Mantenimiento 🔄",
        prompt = "Diseñar un protocolo de inducción para mantenimiento de aplicaciones con checklist de acceso, arquitectura, flujos de despliegue, SLAs y bucle de refinamiento.",
        mode = ExpertMode.LOOP_ENGINEER
    )
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ExampleChips(
    onSelect: (ExampleIdea) -> Unit,
    isLoading: Boolean,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "¿No sabes por dónde empezar? Prueba con un ejemplo:",
            style = MaterialTheme.typography.bodySmall,
            color = AuraSubtext,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            defaultExamples.forEachIndexed { index, example ->
                SuggestionChip(
                    onClick = { if (!isLoading) onSelect(example) },
                    label = {
                        Text(
                            text = example.label,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = AuraText
                        )
                    },
                    colors = SuggestionChipDefaults.suggestionChipColors(
                        containerColor = AuraSurfaceVariant
                    ),
                    border = SuggestionChipDefaults.suggestionChipBorder(borderColor = AuraBorder),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.testTag("example_chip_$index")
                )
            }
        }
    }
}
