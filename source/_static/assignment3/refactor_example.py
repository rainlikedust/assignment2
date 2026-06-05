def summarize_scores(scores):
    total = 0
    count = 0
    best = None
    for score in scores:
        total = total + score
        count = count + 1
        if best is None or score > best:
            best = score
    if count == 0:
        return {"average": 0, "best": None}
    return {"average": total / count, "best": best}


if __name__ == "__main__":
    print(summarize_scores([78, 92, 85]))
