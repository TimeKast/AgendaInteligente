---
trigger: always_on
---

# CORE-RT — Runtime Rules

> Reglas específicas del runtime AI activo. Extiende CORE.md.
> **Runtime actual: Antigravity (Gemini Code Assist)**
>
> Al cambiar de runtime (ej: Claude Code), actualizar la nota de runtime
> y el contenido de las secciones según las limitaciones del nuevo entorno.

---

## 1. Shell Safety

#### 1.1 🔴 NUNCA usar heredocs en terminal

```
❌ PROHIBIDO: cat << 'EOF' > file.md (cualquier variante de heredoc)
✅ OBLIGATORIO: Usar write_to_file / replace_file_content tools
✅ ALTERNATIVA: echo "una línea" > file (solo 1 línea)
```

> **Por qué:** Antigravity ejecuta comandos en subshells donde heredocs
> pueden truncarse o fallar silenciosamente. Los tools de escritura son
> atómicos y verificables.

#### 1.2 🔴 NUNCA usar asteriscos en grep dentro de run_command

```
❌ PROHIBIDO: grep -q "> \*\*Status:\*\*" (glob expansion → cuelgue infinito)
✅ OBLIGATORIO: grep -qF '**Status:**' (fixed string, sin glob)
✅ ALTERNATIVA: grep -E con regex seguro (sin ** literal)
```

> **Por qué:** zsh expande `**` como glob recursivo antes de pasarlo a grep,
> causando que el comando itere sobre todo el filesystem.

---

_TimeKast Factory — Runtime Rules (L2)_
