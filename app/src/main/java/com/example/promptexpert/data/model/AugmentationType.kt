package com.example.promptexpert.data.model

enum class AugmentationType(
    val id: String,
    val title: String,
    val description: String,
    val rule: String
) {
    CRITICAL_PERSPECTIVE(
        id = "critical_perspective",
        title = "Perspectiva Crítica",
        description = "Añade escepticismo constructivo y contra-argumentos.",
        rule = "Modifica el prompt para que la IA actúe como un crítico severo pero constructivo, buscando activamente fallos, asunciones no probadas y contra-argumentos a la idea principal."
    ),
    CREATIVE_ANALOGY(
        id = "creative_analogy",
        title = "Analogía Creativa",
        description = "Reformula la idea con metáforas memorables.",
        rule = "Modifica el prompt para requerir que la respuesta explique la idea central utilizando una analogía o metáfora creativa, memorable e inesperada de un campo completamente diferente (ej. biología, música, cocina)."
    ),
    UNEXPECTED_ROLE(
        id = "unexpected_role",
        title = "Rol Inesperado",
        description = "Enfoca la consulta desde una perspectiva no convencional.",
        rule = "Modifica el prompt para que la IA adopte un rol o punto de vista inusual y no obvio para el tema (ej. para un problema de negocios, responder desde la perspectiva de un arqueólogo del futuro o un filósofo estoico)."
    ),
    LOOP_REFINEMENT(
        id = "loop_refinement",
        title = "Bucle Iterativo",
        description = "Inyecta un ciclo de autoevaluación y refinamiento.",
        rule = "Reformula el prompt aplicando el framework de Loop Engineering: la IA debe generar una primera versión, autoevaluarla críticamente identificando al menos 3 debilidades, y producir una versión final refinada superando esas debilidades."
    )
}
