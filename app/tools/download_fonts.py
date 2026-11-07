import urllib.request
import re
import os

url = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lexend:wght@600;700;800&display=swap'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})

with urllib.request.urlopen(req) as resp:
    css = resp.read().decode('utf-8')

os.makedirs('app/fonts', exist_ok=True)
blocks = css.split('@font-face {')
downloaded = []

for b in blocks[1:]:
    if '/* latin */' in b or 'U+0000-00FF' in b:
        m_fam = re.search(r"font-family:\s*'([^']+)'", b)
        m_weight = re.search(r"font-weight:\s*(\d+)", b)
        m_url = re.search(r"src:\s*url\((https://[^)]+)\)", b)
        if m_fam and m_weight and m_url:
            fam_name = m_fam.group(1)
            clean_fam = fam_name.replace(' ', '_').lower()
            weight = m_weight.group(1)
            file_url = m_url.group(1)
            filename = f"{clean_fam}_w{weight}.woff2"
            local_path = os.path.join('app', 'fonts', filename)
            
            if not os.path.exists(local_path):
                f_req = urllib.request.Request(file_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(f_req) as f_resp:
                    with open(local_path, 'wb') as out_f:
                        out_f.write(f_resp.read())
            
            size_kb = os.path.getsize(local_path) / 1024
            print(f"Downloaded: {fam_name} {weight} -> {filename} ({size_kb:.1f} KB)")
            downloaded.append((fam_name, weight, filename))

print(f"Total downloaded fonts: {len(downloaded)}")
