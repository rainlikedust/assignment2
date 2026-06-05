import argparse
import json
import os
import sys
import urllib.error
import urllib.request


API_URL = "https://api.deepseek.com/chat/completions"
MODEL = "deepseek-v4-flash"


def read_file(path: str, max_chars: int) -> str:
    with open(path, "r", encoding="utf-8") as handle:
        content = handle.read()
    if len(content) > max_chars:
        return content[:max_chars] + "\n\n[File truncated for this low-cost API test.]"
    return content


def ask_deepseek(file_text: str, question: str) -> str:
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY is not set.")

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a file-analysis agent. Answer only from the provided file, "
                    "and say when the file does not contain enough information."
                ),
            },
            {
                "role": "user",
                "content": f"File content:\n{file_text}\n\nQuestion: {question}",
            },
        ],
        "temperature": 0.2,
        "max_tokens": 350,
    }

    request = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            response_body = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"DeepSeek API request failed: HTTP {error.code}: {detail}") from error

    data = json.loads(response_body)
    return data["choices"][0]["message"]["content"].strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Minimal DeepSeek file-analysis agent.")
    parser.add_argument("file", help="Path to the text file to analyze.")
    parser.add_argument("question", help="Question for the agent to answer from the file.")
    parser.add_argument("--max-chars", type=int, default=4000, help="Maximum file characters to send.")
    args = parser.parse_args()

    file_text = read_file(args.file, args.max_chars)
    answer = ask_deepseek(file_text, args.question)
    print(answer)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
