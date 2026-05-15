import json
import glob
import os

INDEX_KEYS = [
    'dok_id', 'titel', 'utskott', 'nummer', 'datum', 'rm',
    'kort_sammanfattning', 'roster', 'tags', 'status', 'passed', 'delvoterings',
]


def build_index(data_dir: str):
    betankanden_dir = os.path.join(data_dir, 'betankanden')
    index = []
    for path in sorted(glob.glob(f"{betankanden_dir}/*.json")):
        with open(path, encoding='utf-8') as f:
            detail = json.load(f)
        entry = {k: detail[k] for k in INDEX_KEYS if k in detail}
        index.append(entry)

    index.sort(key=lambda x: x.get('datum', ''), reverse=True)

    out_index = os.path.join(data_dir, 'index.json')
    with open(out_index, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    out_search = os.path.join(data_dir, 'search-index.json')
    with open(out_search, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"Built index with {len(index)} entries → {out_index}")
