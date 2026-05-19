---
description: Generate a branded PDF from a Markdown doc via fx-pdf-export
argument-hint: '<input.md> [--no-cover] [--no-logos] [--no-toc] [--appendix "T:F"] [--output PATH]'
---

# /pdf

Convierte un Markdown en PDF con branding TimeKast usando el skill `fx-pdf-export`.

**Argumento:** `$ARGUMENTS`

---

## Instrucciones al agente

1. **Invocar skill `fx-pdf-export`** — lee `.claude/skills/fx-pdf-export/SKILL.md` con Read tool antes de ejecutar (CC.md §7).
2. Parsear `$ARGUMENTS`:
   - Primer token que termine en `.md` → input path (obligatorio)
   - Si falta → pedir al usuario qué doc convertir (no asumir)
   - Resto de tokens → flags pass-through al script
3. Validar que el MD exista (Read o Glob). Si no existe → reportar y detener.
4. Decidir path:
   - Con flags `--no-cover` y sin `--appendix` → fast path (`npx md-to-pdf`)
   - Caso general → full path (`python3 build_pdf.py`)
5. Ejecutar via Bash:

   **Fast path:**

   ```bash
   npx -y md-to-pdf \
     --stylesheet .claude/skills/fx-pdf-export/resources/timekast-style.css \
     --pdf-options '{"format":"A4","margin":{"top":"20mm","bottom":"20mm","left":"20mm","right":"20mm"},"printBackground":true}' \
     <input.md>
   ```

   **Full path:**

   ```bash
   python3 .claude/skills/fx-pdf-export/scripts/build_pdf.py <input.md> [flags…]
   ```

6. Reportar al usuario en ≤4 líneas:

   ```
   📄 PDF: <output.pdf> (<size>)
   📝 Título: <del H1>
   📷 Logos: <auto-detected | --no-logos>
   ```

7. No abrir el PDF automáticamente. No committear.

---

## Reglas

- **NUNCA** instalar paquetes sin autorización (el `npx -y md-to-pdf` resuelve on-the-fly; no es instalación global)
- **NUNCA** sobreescribir un PDF existente sin mostrar el path primero
- Si `build_pdf.py` reporta "⚠️ No logos found" → es informativo, no error; continuar
- Si el MD tiene <10 líneas o no tiene H1 → advertir "doc puede verse vacío en PDF" antes de generar

---

## Edge cases

- **Input sin `.md`:** pedir confirmación — ¿es MD sin extensión? si no, abortar
- **`project-config.md` ausente:** el script cae a fallback (busca logos en raíz); no es error
- **`--output` apunta a dir inexistente:** el script lo crea (ver `os.makedirs(..., exist_ok=True)`)
- **md-to-pdf falla por Chromium no disponible:** reportar el stderr al usuario; es issue de env, no del skill
