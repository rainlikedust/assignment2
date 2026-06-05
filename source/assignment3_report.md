# Assignment 3: Deployment and Integration of AI Agents

Deadline: May 29th, 2026 (UTC+8)  
Scope: Required 15 points only. I did not attempt the bonus section.

## 1. Objective and Setup

The goal of this assignment was to deploy and compare an online LLM agent, a local LLM model, and an IDE-integrated assistant. I chose a low-cost setup:

- Online model: DeepSeek API, used once for file analysis.
- Local model: Ollama with `qwen2.5:0.5b`.
- IDE integration: VS Code with the Continue extension, configured to use the local Ollama model.

The workspace contains these main files:

- `file_analysis_agent.py`: minimal online file-analysis agent.
- `sample_document.txt`: short input file analyzed by the online agent.
- `refactor_example.py`: code used for IDE explanation/refactor testing.
- `refactor_example_refactored.py`: manually checked refactored version.
- `evidence/`: command output and model interaction records.

## 2. Online Agent with DeepSeek

I implemented a small Python file-analysis agent using only the Python standard library. The script reads a local text file, sends it to the DeepSeek chat completion endpoint, and asks a specific question about the file. The API key is read from the `DEEPSEEK_API_KEY` environment variable and is not written into the script or report.

Command used:

```powershell
python .\file_analysis_agent.py .\sample_document.txt "According to this file, what are the required parts of Assignment 3 and what is the lowest-cost implementation path?"
```

Model and endpoint:

```text
Model: deepseek-v4-flash
Endpoint: https://api.deepseek.com/chat/completions
```

Output:

```text
According to the file, Assignment 3 requires:

1. Creating an online agent with an API model that searches the web or analyzes a file to answer a specific question.
2. Installing Ollama and deploying a local model, demonstrated through a terminal or simple UI.
3. Integrating an LLM into an IDE (VS Code, Cursor, or PyCharm) and showing how the AI helps explain or refactor code.
4. Writing a Markdown report documenting setup steps, challenges, solutions, and a reflection comparing online and local models.

The lowest-cost implementation path described in the file is: one DeepSeek API call for file analysis, a small Ollama model for local testing, and using Continue in VS Code for IDE integration.
```

Evidence file: `evidence/online_agent_run.txt`

## 3. Local Model Deployment with Ollama

Ollama was installed on Windows through `winget`. The normal install command first failed because the Microsoft Store source could not connect, so I repeated the install while explicitly using the `winget` source:

```powershell
winget install --id Ollama.Ollama -e --source winget --accept-package-agreements --accept-source-agreements
```

After installation, I pulled the small local model:

```powershell
ollama pull qwen2.5:0.5b
```

Verification:

```text
Command: ollama --version
ollama version is 0.24.0

Command: ollama list
NAME            ID              SIZE      MODIFIED
qwen2.5:0.5b    a8b0c5157701    397 MB    About a minute ago
```

Basic interaction:

```text
Command: ollama run qwen2.5:0.5b "Explain what an AI agent is in two sentences."

Output:
An AI (Artificial Intelligence) agent is a software program or a system designed to execute tasks and perform actions autonomously based on predefined rules and instructions. It utilizes machine learning algorithms, natural language processing, and other artificial intelligence technologies to process information, make decisions, and adapt to user interactions in order to achieve specific goals.
```

Note: PowerShell captured spinner/control characters from `ollama run`, so I recorded a clean equivalent response through Ollama's local API with `stream=false`.

Evidence file: `evidence/local_ollama_run.txt`

## 4. IDE Integration with VS Code and Continue

VS Code was installed through `winget`, and the Continue extension was installed with the VS Code command line:

```powershell
code --install-extension Continue.continue --force
```

Verification:

```text
Command: code --version
1.121.0
f6cfa2ea2403534de03f069bdf160d06451ed282
x64

Command: code --list-extensions --show-versions
continue.continue@1.2.22
```

Continue was configured in `C:\Users\dust\.continue\config.yaml` to use the local Ollama model:

```yaml
name: Assignment 3 Local Ollama
version: 1.0.0
schema: v1

models:
  - name: Qwen2.5 0.5B Local
    provider: ollama
    model: qwen2.5:0.5b
    apiBase: http://127.0.0.1:11434
    roles:
      - chat
      - edit
```

I opened the workspace in VS Code and used the same local model configured for Continue to analyze `refactor_example.py`.

Prompt:

```text
Explain what refactor_example.py does, then provide a cleaner refactor while keeping the same behavior.
```

The model correctly recognized that `summarize_scores` calculates the average and best score, but its suggested refactor missed the empty-list case and incorrectly showed the average of `[78, 92, 85]` as `90`. I treated this as a useful review signal instead of accepting it blindly. I manually checked the behavior and wrote a corrected refactor:

```python
def summarize_scores(scores):
    if not scores:
        return {"average": 0, "best": None}

    return {
        "average": sum(scores) / len(scores),
        "best": max(scores),
    }
```

Both the original and refactored versions produced the same output for `[78, 92, 85]`:

```text
{'average': 85.0, 'best': 92}
```

Evidence files:

- `evidence/ide_continue_setup.txt`
- `evidence/ide_refactor_response.txt`

## 5. Challenges and Solutions

The first challenge was installation reliability. `winget` tried to query the Microsoft Store source and failed, but specifying `--source winget` solved the issue.

The second challenge was command availability after installation. The current PowerShell session did not immediately recognize `ollama` and `code` from `PATH`, so I used their full installed paths for verification.

The third challenge was local model quality. The small `qwen2.5:0.5b` model was cheap and fast enough to run locally, but it made mistakes in the refactoring example. I solved this by verifying the output with Python and keeping the empty-list behavior in the final refactor.

## 6. Reflection

The online DeepSeek model was easier to use once the API key was available. It followed the file-analysis task accurately, produced a clear answer, and required no local model download. Its disadvantages are that it depends on internet access, uses an API key, may cost money if used heavily, and sends the file content to a remote service.

The local Ollama model was better for privacy and repeated experimentation because it runs on my computer and does not consume API credits. However, setup took longer because Ollama and the model had to be downloaded, and the small 0.5B model was less reliable. In the refactoring task, I had to check the model's suggestion manually because it made a logic mistake.

For my workflow, the online model is better for accurate file analysis and higher-quality answers. The local model is useful inside the IDE for quick explanations, rough refactoring ideas, and low-cost practice, but I should not trust it without testing. The most practical setup is to use the local model for quick drafts and explanations, then verify important code changes with tests or a stronger model.

## 7. Rubric Checklist

| Criteria | Evidence |
| --- | --- |
| Online Agent, file analysis | `file_analysis_agent.py`, `sample_document.txt`, `evidence/online_agent_run.txt` |
| Local Model, Ollama deployment | `evidence/local_ollama_run.txt` |
| IDE Integration | VS Code 1.121.0, Continue 1.2.22, `C:\Users\dust\.continue\config.yaml`, `evidence/ide_continue_setup.txt` |
| Documentation and Reflection | This Markdown report |

References:

- DeepSeek API documentation: https://api-docs.deepseek.com/
- Ollama Windows download: https://ollama.com/download/windows
- Ollama qwen2.5 model page: https://ollama.com/library/qwen2.5
- Continue VS Code Marketplace: https://marketplace.visualstudio.com/items?itemName=Continue.continue

## 8. Online Attachments

<ul>
  <li><a href="_static/assignment3/file_analysis_agent.py">file_analysis_agent.py</a></li>
  <li><a href="_static/assignment3/sample_document.txt">sample_document.txt</a></li>
  <li><a href="_static/assignment3/refactor_example.py">refactor_example.py</a></li>
  <li><a href="_static/assignment3/refactor_example_refactored.py">refactor_example_refactored.py</a></li>
  <li><a href="_static/assignment3/online_agent_run.txt">online_agent_run.txt</a></li>
  <li><a href="_static/assignment3/local_ollama_run.txt">local_ollama_run.txt</a></li>
  <li><a href="_static/assignment3/ide_continue_setup.txt">ide_continue_setup.txt</a></li>
  <li><a href="_static/assignment3/ide_refactor_response.txt">ide_refactor_response.txt</a></li>
</ul>
