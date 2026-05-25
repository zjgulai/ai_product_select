#!/usr/bin/env python3
"""
VOC AI 选品平台 — 全量数据生成器
生成 realistic 母婴品类数据，覆盖 TikTok + Amazon + Fusion 全页面
"""

import json
import random
import os
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)

OUTDIR = Path(__file__).parent / "output"
OUTDIR.mkdir(exist_ok=True)

# ========================================================================
# 1. 概念定义（50 个母婴概念）
# ========================================================================

CONCEPTS = [
    # 喂养用品
    {"id": "baby-bottle", "name": "婴儿奶瓶", "tiktok_kw": ["奶瓶", "婴儿奶瓶", "玻璃奶瓶"], "amazon_kw": ["baby bottle", "infant bottle", "glass baby bottle"], "cats": ["喂养用品", "奶瓶"]},
    {"id": "bottle-warmer", "name": "温奶器", "tiktok_kw": ["温奶器", "暖奶器", "奶瓶加热"], "amazon_kw": ["bottle warmer", "baby bottle warmer"], "cats": ["喂养用品", "温奶器"]},
    {"id": "sterilizer", "name": "奶瓶消毒器", "tiktok_kw": ["消毒器", "奶瓶消毒", "紫外线消毒"], "amazon_kw": ["bottle sterilizer", "UV sterilizer", "baby sterilizer"], "cats": ["喂养用品", "消毒器"]},
    {"id": "food-maker", "name": "辅食机", "tiktok_kw": ["辅食机", "婴儿辅食", "料理棒"], "amazon_kw": ["baby food maker", "food processor baby"], "cats": ["喂养用品", "辅食机"]},
    {"id": "breast-pump", "name": "电动吸奶器", "tiktok_kw": ["吸奶器", "电动吸奶器", "母乳"], "amazon_kw": ["breast pump", "electric breast pump"], "cats": ["喂养用品", "吸奶器"]},
    # 出行用品
    {"id": "stroller", "name": "婴儿推车", "tiktok_kw": ["婴儿推车", "轻便推车", "高景观推车"], "amazon_kw": ["baby stroller", "lightweight stroller", "jogging stroller"], "cats": ["出行用品", "推车"]},
    {"id": "carseat", "name": "儿童安全座椅", "tiktok_kw": ["安全座椅", "车载座椅", "isofix"], "amazon_kw": ["car seat", "infant car seat", "convertible car seat"], "cats": ["出行用品", "安全座椅"]},
    {"id": "baby-carrier", "name": "婴儿背带", "tiktok_kw": ["婴儿背带", "前抱式", "腰凳"], "amazon_kw": ["baby carrier", "infant carrier", "wrap carrier"], "cats": ["出行用品", "背带"]},
    {"id": "anti-lost", "name": "防走失背包", "tiktok_kw": ["防走失包", "牵引绳", "儿童背包"], "amazon_kw": ["anti lost backpack", "toddler leash backpack"], "cats": ["出行用品", "防走失"]},
    # 护理用品
    {"id": "diaper", "name": "纸尿裤", "tiktok_kw": ["纸尿裤", "拉拉裤", "尿不湿"], "amazon_kw": ["diapers", "baby diapers", "pull ups"], "cats": ["护理用品", "纸尿裤"]},
    {"id": "wet-wipes", "name": "婴儿湿巾", "tiktok_kw": ["婴儿湿巾", "手口湿巾", "棉柔巾"], "amazon_kw": ["baby wipes", "sensitive wipes", "water wipes"], "cats": ["护理用品", "湿巾"]},
    {"id": "body-lotion", "name": "婴儿润肤乳", "tiktok_kw": ["润肤乳", "婴儿面霜", "保湿"], "amazon_kw": ["baby lotion", "infant moisturizer", "baby cream"], "cats": ["护理用品", "润肤乳"]},
    {"id": "diaper-rash", "name": "护臀膏", "tiktok_kw": ["护臀膏", "红屁屁", "pp霜"], "amazon_kw": ["diaper rash cream", "butt paste", "zinc oxide cream"], "cats": ["护理用品", "护臀膏"]},
    {"id": "baby-wash", "name": "婴儿洗发沐浴露", "tiktok_kw": ["洗发沐浴", "婴儿洗护", "无泪配方"], "amazon_kw": ["baby shampoo", "baby wash", "tear free shampoo"], "cats": ["护理用品", "洗护"]},
    # 睡眠用品
    {"id": "sleeping-bag", "name": "婴儿睡袋", "tiktok_kw": ["睡袋", "防惊跳", "分腿睡袋"], "amazon_kw": ["sleep sack", "wearable blanket", "baby sleeping bag"], "cats": ["睡眠用品", "睡袋"]},
    {"id": "swaddle", "name": "婴儿抱被", "tiktok_kw": ["抱被", "包被", "襁褓"], "amazon_kw": ["swaddle blanket", "receiving blanket", "muslin swaddle"], "cats": ["睡眠用品", "抱被"]},
    {"id": "crib", "name": "婴儿床", "tiktok_kw": ["婴儿床", "拼接床", "可移动"], "amazon_kw": ["crib", "baby crib", "convertible crib"], "cats": ["睡眠用品", "婴儿床"]},
    {"id": "rocker", "name": "婴儿摇椅", "tiktok_kw": ["摇椅", "安抚椅", "电动摇椅"], "amazon_kw": ["baby rocker", "bouncer", "infant seat"], "cats": ["睡眠用品", "摇椅"]},
    # 玩具早教
    {"id": "play-gym", "name": "婴儿健身架", "tiktok_kw": ["健身架", "脚踏琴", "玩具架"], "amazon_kw": ["play gym", "baby play mat", "activity gym"], "cats": ["玩具早教", "健身架"]},
    {"id": "rattle", "name": "手摇铃", "tiktok_kw": ["摇铃", "牙胶", "抓握玩具"], "amazon_kw": ["baby rattle", "teething toy", "grasping toy"], "cats": ["玩具早教", "摇铃"]},
    {"id": "cloth-book", "name": "布书", "tiktok_kw": ["布书", "早教书", "撕不烂"], "amazon_kw": ["cloth book", "soft book baby", "crinkle book"], "cats": ["玩具早教", "布书"]},
    {"id": "walker", "name": "学步车", "tiktok_kw": ["学步车", "助步车", "手推车"], "amazon_kw": ["baby walker", "push walker", "activity walker"], "cats": ["玩具早教", "学步车"]},
    {"id": "crawling-mat", "name": "爬行垫", "tiktok_kw": ["爬行垫", "地垫", "xpe垫"], "amazon_kw": ["play mat", "crawling mat", "foam play mat"], "cats": ["玩具早教", "爬行垫"]},
    # 安全用品
    {"id": "baby-monitor", "name": "婴儿监视器", "tiktok_kw": ["监视器", "看护器", "摄像头"], "amazon_kw": ["baby monitor", "video baby monitor", "wifi baby monitor"], "cats": ["安全用品", "监视器"]},
    {"id": "thermometer", "name": "婴儿体温计", "tiktok_kw": ["体温计", "耳温枪", "额温枪"], "amazon_kw": ["baby thermometer", "forehead thermometer", "ear thermometer"], "cats": ["安全用品", "体温计"]},
    {"id": "safety-gate", "name": "安全门栏", "tiktok_kw": ["门栏", "楼梯护栏", "宠物隔离"], "amazon_kw": ["baby gate", "safety gate", "stair gate"], "cats": ["安全用品", "门栏"]},
    # 孕产妇
    {"id": "nursing-pillow", "name": "哺乳枕", "tiktok_kw": ["哺乳枕", "喂奶枕", "孕妇枕"], "amazon_kw": ["nursing pillow", "breastfeeding pillow", "boppy pillow"], "cats": ["孕产妇", "哺乳枕"]},
    {"id": "belly-band", "name": "托腹带", "tiktok_kw": ["托腹带", "孕妇腰带", "护腰"], "amazon_kw": ["maternity belt", "pregnancy support belt", "belly band"], "cats": ["孕产妇", "托腹带"]},
]

# 补齐到 30 个（当前 27 个）
EXTRA_CONCEPTS = [
    {"id": "pacifier", "name": "安抚奶嘴", "tiktok_kw": ["安抚奶嘴", "奶嘴", "超软"], "amazon_kw": ["pacifier", "soothie", "orthodontic pacifier"], "cats": ["喂养用品", "奶嘴"]},
    {"id": "sippy-cup", "name": "学饮杯", "tiktok_kw": ["学饮杯", "吸管杯", "鸭嘴杯"], "amazon_kw": ["sippy cup", "straw cup", "training cup"], "cats": ["喂养用品", "学饮杯"]},
    {"id": "bib", "name": "围兜", "tiktok_kw": ["围兜", "硅胶围兜", "防水围兜"], "amazon_kw": ["baby bib", "silicone bib", "waterproof bib"], "cats": ["喂养用品", "围兜"]},
]
ALL_CONCEPTS = CONCEPTS + EXTRA_CONCEPTS

def generate_concepts():
    records = []
    for i, c in enumerate(ALL_CONCEPTS):
        records.append({
            "concept_id": c["id"],
            "name": c["name"],
            "name_en": c["amazon_kw"][0],
            "description": f"{c['name']}是母婴{c['cats'][0]}品类中的核心产品，市场需求稳定，适合跨境电商选品。",
            "tiktok_keywords": json.dumps(c["tiktok_kw"], ensure_ascii=False),
            "tiktok_hashtags": json.dumps([f"#{c['id'].replace('-', '')}" for _ in range(3)], ensure_ascii=False),
            "amazon_keywords": json.dumps(c["amazon_kw"], ensure_ascii=False),
            "amazon_categories": json.dumps(c["cats"], ensure_ascii=False),
            "key_features": json.dumps(["安全材质", "易清洗", "便携设计"], ensure_ascii=False),
            "usage_scenes": json.dumps(["日常使用", "外出携带", "旅行"], ensure_ascii=False),
            "confidence": round(random.uniform(0.75, 0.98), 3),
            "mapped_asins": json.dumps([], ensure_ascii=False),
            "mapped_videos": json.dumps([], ensure_ascii=False),
            "status": "active",
        })
    return records

# ========================================================================
# 2. TikTok 商品数据（300 条）
# ========================================================================

TIKTOK_SHOPS = ["贝亲旗舰店", "好孩子官方", " Babycare", "可优比", "十月结晶", "全棉时代", "子初", "嫚熙", "英式母婴", "费雪"]
TIKTOK_CATEGORIES = ["喂养用品", "出行用品", "护理用品", "睡眠用品", "玩具早教", "安全用品", "孕产妇"]

def generate_tiktok_products(n=300):
    records = []
    for i in range(n):
        concept = random.choice(ALL_CONCEPTS)
        sales = int(random.paretovariate(2.5) * 500) + 50
        price = round(random.gauss(80, 40), 2)
        price = max(15, min(400, price))
        records.append({
            "id": i + 1,
            "name": f"{random.choice(['智能','便携','折叠','多功能'])}{concept['name']}",
            "category": concept["cats"][0],
            "sales": sales,
            "sales_growth": f"+{random.randint(5, 300)}%",
            "revenue": round(sales * price, 2),
            "price": price,
            "rating": round(random.gauss(4.5, 0.25), 2),
            "influencers": random.randint(5, 2000),
            "date": (datetime.now() - timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d"),
            "shop": random.choice(TIKTOK_SHOPS),
        })
    return records

# ========================================================================
# 3. TikTok 达人数据（200 条）
# ========================================================================

def generate_tiktok_creators(n=200):
    records = []
    for i in range(n):
        followers = int(random.paretovariate(2.2) * 10000) + 1000
        sales = int(followers * random.uniform(0.01, 0.15))
        records.append({
            "id": i + 1,
            "username": f"creator_{random.randint(1000, 9999)}",
            "display_name": f"{random.choice(['宝妈','奶爸','育儿','母婴'])}达人{random.randint(1, 99)}",
            "followers": followers,
            "monthly_sales": sales,
            "monthly_revenue": round(sales * random.uniform(30, 120), 2),
            "categories": json.dumps(random.sample(TIKTOK_CATEGORIES, k=random.randint(1, 3)), ensure_ascii=False),
            "fan_growth_rate": round(random.gauss(15, 10), 2),
        })
    return records

# ========================================================================
# 4. TikTok 小店数据（100 条）
# ========================================================================

def generate_tiktok_shops(n=100):
    records = []
    for i in range(n):
        sales = int(random.paretovariate(2.0) * 2000) + 100
        records.append({
            "id": i + 1,
            "name": random.choice(TIKTOK_SHOPS),
            "country": random.choice(["中国", "中国", "中国", "美国", "英国"]),
            "category": random.choice(TIKTOK_CATEGORIES),
            "sales": sales,
            "sales_growth": f"+{random.randint(10, 500)}%",
            "revenue": round(sales * random.uniform(40, 100), 2),
            "active_products": random.randint(10, 200),
            "rating": round(random.gauss(4.4, 0.3), 2),
            "influencers": random.randint(3, 500),
        })
    return records

# ========================================================================
# 5. TikTok 视频数据（300 条）
# ========================================================================

def generate_tiktok_videos(n=300):
    records = []
    for i in range(n):
        views = int(random.paretovariate(2.0) * 50000) + 1000
        records.append({
            "id": i + 1,
            "title": f"{random.choice(['测评','推荐','开箱','避坑','种草'])}{random.choice(ALL_CONCEPTS)['name']}",
            "views": views,
            "likes": int(views * random.uniform(0.03, 0.12)),
            "engagement_rate": round(random.gauss(6.5, 2), 2),
            "monthly_sales": int(views * random.uniform(0.001, 0.01)),
            "date": (datetime.now() - timedelta(days=random.randint(1, 60))).strftime("%Y-%m-%d"),
        })
    return records

# ========================================================================
# 6. TikTok 直播数据（100 条）
# ========================================================================

def generate_tiktok_lives(n=100):
    records = []
    for i in range(n):
        viewers = int(random.paretovariate(2.0) * 5000) + 200
        records.append({
            "id": i + 1,
            "title": f"{random.choice(['爆款返场','新品首发','限时秒杀','工厂直供'])}{random.choice(ALL_CONCEPTS)['name']}",
            "host": f"主播{random.randint(1, 99)}",
            "viewers": viewers,
            "sales": int(viewers * random.uniform(0.05, 0.3)),
            "revenue": round(viewers * random.uniform(5, 30), 2),
            "duration": f"{random.randint(1, 4)}小时{random.randint(0, 59)}分",
            "date": (datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d"),
        })
    return records

# ========================================================================
# 7. Amazon 商品数据（500 条）
# ========================================================================

AMAZON_BRANDS = ["Philips Avent", "Dr. Brown's", "Tommee Tippee", "MAM", "NUK", "Comotomo", "Medela", "Spectra", "Lansinoh", "Haakaa",
                 "Graco", "Chicco", "Britax", "Maxi-Cosi", "Evenflo", "BabyBjorn", "Ergobaby", "Moby", "Boppy", "DockATot",
                 "Fisher-Price", "VTech", "Melissa & Doug", "Manhattan Toy", "Lovevery", "Skip Hop", "Munchkin", "OXO Tot", "Boon", "Nuby"]
AMAZON_CATEGORIES = ["Baby Products > Feeding > Bottles", "Baby Products > Diapering > Diapers", "Baby Products > Safety > Monitors",
                     "Baby Products > Gear > Strollers", "Baby Products > Nursery > Cribs", "Baby Products > Toys > Early Development"]

def generate_amazon_products(n=500):
    records = []
    for i in range(n):
        concept = random.choice(ALL_CONCEPTS)
        price = round(random.gauss(25, 15), 2)
        price = max(8, min(150, price))
        sales = int(random.paretovariate(2.5) * 300) + 10
        records.append({
            "id": i + 1,
            "asin": f"B0{random.randint(10000000, 99999999)}",
            "title": f"{random.choice(AMAZON_BRANDS)} {concept['name']} — {random.choice(['Premium','Pro','Essential','Ultra'])} Series",
            "brand": random.choice(AMAZON_BRANDS),
            "category": concept["cats"][0],
            "category_path": random.choice(AMAZON_CATEGORIES),
            "price": price,
            "monthly_sales": sales,
            "monthly_revenue": round(sales * price, 2),
            "rating": round(random.gauss(4.3, 0.4), 2),
            "review_count": random.randint(5, 2000),
            "bsr_rank": random.randint(100, 50000),
            "launch_date": (datetime.now() - timedelta(days=random.randint(30, 900))).strftime("%Y-%m-%d"),
            "fulfillment_type": random.choice(["FBA", "FBA", "FBA", "FBM"]),
            "tiktok_video_count": random.randint(0, 200),
            "tiktok_heat_score": round(random.uniform(0, 100), 2),
        })
    return records

# ========================================================================
# 8. Amazon 评论数据（3000 条）
# ========================================================================

REVIEW_SENTIMENTS = ["positive"] * 65 + ["neutral"] * 20 + ["negative"] * 15
REVIEW_TEMPLATES = {
    "positive": ["Great product, my baby loves it!", "Excellent quality and fast shipping.", "Worth every penny, highly recommend!",
                 "Perfect for everyday use.", "Best {product} we've tried so far.", "Amazing value for money."],
    "neutral": ["It's okay, nothing special.", "Decent quality but a bit pricey.", "Works as described.", "Average product."],
    "negative": ["Not as described, disappointed.", "Broke after 2 weeks of use.", "Poor quality, would not recommend.", "Too expensive for what you get."]
}

def generate_amazon_reviews(products, n=3000):
    records = []
    for i in range(n):
        product = random.choice(products)
        sentiment = random.choice(REVIEW_SENTIMENTS)
        rating = {"positive": random.randint(4, 5), "neutral": 3, "negative": random.randint(1, 2)}[sentiment]
        template = random.choice(REVIEW_TEMPLATES[sentiment])
        records.append({
            "id": i + 1,
            "asin": product["asin"],
            "review_id": f"R{random.randint(1000000000, 9999999999)}",
            "rating": rating,
            "title": template.split(",")[0] if "," in template else template[:30],
            "content": template.replace("{product}", product["category"]),
            "sentiment": sentiment,
            "verified": random.random() > 0.3,
            "helpful_votes": random.randint(0, 50) if sentiment == "positive" else random.randint(0, 10),
            "review_date": (datetime.now() - timedelta(days=random.randint(1, 365))).strftime("%Y-%m-%d"),
        })
    return records

# ========================================================================
# 9. Fusion 概念指标（30 概念 × 30 天 = 900 条）
# ========================================================================

def generate_concept_metrics(concepts, n_days=30):
    records = []
    end_date = datetime.now()
    active_concepts = [c for c in concepts if c["status"] == "active"][:30]
    for concept in active_concepts:
        base_video = random.randint(50, 500)
        base_sales = random.randint(1000, 50000)
        base_rating = random.uniform(3.5, 4.8)
        for day in range(n_days):
            date = (end_date - timedelta(days=day)).strftime("%Y-%m-%d")
            # 添加一些随机波动和趋势
            video_count = max(10, int(base_video * (1 + random.uniform(-0.2, 0.3))))
            sales = max(100, int(base_sales * (1 + random.uniform(-0.3, 0.4))))
            rating = min(5.0, max(1.0, base_rating + random.uniform(-0.3, 0.3)))
            
            # SHI = Social Heat Index (视频热度)
            shi = min(100, (video_count / 5) + random.uniform(0, 20))
            # CVI = Commercial Value Index (商业价值)
            cvi = min(100, (sales / 500) + (rating * 5) + random.uniform(0, 15))
            # OppScore = 综合机会分
            opp = min(100, shi * 0.45 + cvi * 0.35 + random.uniform(5, 25))
            
            records.append({
                "concept_id": concept["concept_id"],
                "metric_date": date,
                "tiktok_video_count": video_count,
                "tiktok_total_views": video_count * random.randint(500, 2000),
                "tiktok_total_likes": video_count * random.randint(20, 100),
                "tiktok_engagement_rate": round(random.uniform(3, 12), 2),
                "tiktok_influencer_count": random.randint(5, 200),
                "tiktok_hashtag_growth": round(random.uniform(-10, 50), 2),
                "amazon_product_count": random.randint(10, 100),
                "amazon_total_sales": sales,
                "amazon_avg_rating": round(rating, 2),
                "amazon_review_growth": round(random.uniform(-5, 30), 2),
                "amazon_seller_count": random.randint(5, 50),
                "amazon_new_product_ratio": round(random.uniform(5, 35), 2),
                "amazon_revenue_estimate": round(sales * random.uniform(15, 80), 2),
                "shi_score": round(shi, 2),
                "cvi_score": round(cvi, 2),
                "opportunity_score": round(opp, 2),
                "trend_momentum": round(random.uniform(-20, 40), 2),
                "voc_gap_score": round(random.uniform(10, 80), 2),
            })
    return records

# ========================================================================
# 10. IPMS 项目数据（20 条）
# ========================================================================

def generate_ipms_projects(concepts, n=20):
    statuses = ["tracking", "analysis", "decision", "execution", "completed"]
    records = []
    for i in range(n):
        concept = random.choice(concepts)
        status = random.choice(statuses)
        records.append({
            "id": i + 1,
            "project_name": f"{concept['name']}选品项目",
            "concept_id": concept["concept_id"],
            "status": status,
            "priority": random.choice(["high", "medium", "low"]),
            "progress": {"tracking": 10, "analysis": 35, "decision": 60, "execution": 80, "completed": 100}[status],
            "target_market": random.choice(["美国", "英国", "德国", "日本"]),
            "budget": random.randint(5000, 50000),
            "created_at": (datetime.now() - timedelta(days=random.randint(7, 180))).strftime("%Y-%m-%d"),
            "updated_at": datetime.now().strftime("%Y-%m-%d"),
        })
    return records

# ========================================================================
# 主执行
# ========================================================================

def main():
    print("=" * 60)
    print("VOC AI 选品平台 — 数据生成器")
    print("=" * 60)

    # 1. 概念
    print("\n[1/7] 生成概念定义...")
    concepts = generate_concepts()
    with open(OUTDIR / "concepts.json", "w", encoding="utf-8") as f:
        json.dump(concepts, f, ensure_ascii=False, indent=2)
    print(f"    ✓ {len(concepts)} 个概念")

    # 2. TikTok 数据
    print("\n[2/7] 生成 TikTok 数据...")
    tiktok_products = generate_tiktok_products(300)
    tiktok_creators = generate_tiktok_creators(200)
    tiktok_shops = generate_tiktok_shops(100)
    tiktok_videos = generate_tiktok_videos(300)
    tiktok_lives = generate_tiktok_lives(100)
    with open(OUTDIR / "tiktok_products.json", "w", encoding="utf-8") as f:
        json.dump(tiktok_products, f, ensure_ascii=False, indent=2)
    with open(OUTDIR / "tiktok_creators.json", "w", encoding="utf-8") as f:
        json.dump(tiktok_creators, f, ensure_ascii=False, indent=2)
    with open(OUTDIR / "tiktok_shops.json", "w", encoding="utf-8") as f:
        json.dump(tiktok_shops, f, ensure_ascii=False, indent=2)
    with open(OUTDIR / "tiktok_videos.json", "w", encoding="utf-8") as f:
        json.dump(tiktok_videos, f, ensure_ascii=False, indent=2)
    with open(OUTDIR / "tiktok_lives.json", "w", encoding="utf-8") as f:
        json.dump(tiktok_lives, f, ensure_ascii=False, indent=2)
    print(f"    ✓ 商品 {len(tiktok_products)} | 达人 {len(tiktok_creators)} | 小店 {len(tiktok_shops)} | 视频 {len(tiktok_videos)} | 直播 {len(tiktok_lives)}")

    # 3. Amazon 数据
    print("\n[3/7] 生成 Amazon 数据...")
    amazon_products = generate_amazon_products(500)
    amazon_reviews = generate_amazon_reviews(amazon_products, 3000)
    with open(OUTDIR / "amazon_products.json", "w", encoding="utf-8") as f:
        json.dump(amazon_products, f, ensure_ascii=False, indent=2)
    with open(OUTDIR / "amazon_reviews.json", "w", encoding="utf-8") as f:
        json.dump(amazon_reviews, f, ensure_ascii=False, indent=2)
    print(f"    ✓ 商品 {len(amazon_products)} | 评论 {len(amazon_reviews)}")

    # 4. Fusion 指标
    print("\n[4/7] 生成 Fusion 概念指标...")
    metrics = generate_concept_metrics(concepts, 30)
    with open(OUTDIR / "concept_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)
    print(f"    ✓ {len(metrics)} 条指标（{len([c for c in concepts if c['status']=='active'][:30])} 概念 × 30 天）")

    # 5. IPMS 项目
    print("\n[5/7] 生成 IPMS 项目...")
    projects = generate_ipms_projects(concepts, 20)
    with open(OUTDIR / "ipms_projects.json", "w", encoding="utf-8") as f:
        json.dump(projects, f, ensure_ascii=False, indent=2)
    print(f"    ✓ {len(projects)} 个项目")

    print("\n" + "=" * 60)
    print("数据生成完成！")
    print(f"输出目录: {OUTDIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
