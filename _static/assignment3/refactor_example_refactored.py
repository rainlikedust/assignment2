def summarize_scores(scores):
    if not scores:
        return {"average": 0, "best": None}

    return {
        "average": sum(scores) / len(scores),
        "best": max(scores),
    }


if __name__ == "__main__":
    print(summarize_scores([78, 92, 85]))
