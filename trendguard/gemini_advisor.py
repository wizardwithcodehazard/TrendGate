"""
Gemini Campaign Advisor
=======================
Uses Google Gemini 2.5 Flash with Google Search grounding to:
1. Analyze campaign viability before launch
2. Predict trend lifecycle and decline risks
3. Provide competitive landscape analysis
4. Recommend optimal strategies
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

# Import Google GenAI
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️ google-genai not installed. Run: pip install google-genai")


class CampaignAdvisor:
    """
    AI-powered campaign advisor using Gemini with Google Search grounding.
    Helps marketers predict trend success and avoid decline pitfalls.
    """
    
    def __init__(self):
        if not GEMINI_AVAILABLE:
            raise ImportError("google-genai package required. Run: pip install google-genai")
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-flash-latest"
        
        # Configure tools for grounding
        self.tools = [
            types.Tool(google_search=types.GoogleSearch()),
        ]
        
        self.generate_config = types.GenerateContentConfig(
            safety_settings=[
                types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="BLOCK_ONLY_HIGH",
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="BLOCK_ONLY_HIGH",
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="BLOCK_ONLY_HIGH",
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="BLOCK_ONLY_HIGH",
                ),
            ],
            tools=self.tools,
        )
    
    def analyze_campaign(
        self,
        topic: str,
        hashtags: List[str],
        platform: str,
        campaign_aim: str,
        target_audience: str,
        planned_duration_days: int = 30,
        additional_context: Optional[str] = None
    ) -> Dict:
        """
        Analyze a campaign before launch and predict its success/decline trajectory.
        
        Args:
            topic: Main campaign topic/theme
            hashtags: List of planned hashtags
            platform: Target platform (instagram, tiktok, twitter, etc.)
            campaign_aim: What the campaign wants to achieve
            target_audience: Who the campaign targets
            planned_duration_days: How long the campaign will run
            additional_context: Any extra info about the campaign
            
        Returns:
            Comprehensive campaign analysis with predictions
        """
        
        hashtag_str = ", ".join(hashtags)
        
        prompt = f"""You are an expert social media strategist and trend analyst. Analyze this upcoming campaign and provide detailed predictions.

## CAMPAIGN DETAILS
- **Topic:** {topic}
- **Hashtags:** {hashtag_str}
- **Platform:** {platform}
- **Campaign Aim:** {campaign_aim}
- **Target Audience:** {target_audience}
- **Planned Duration:** {planned_duration_days} days
{f"- **Additional Context:** {additional_context}" if additional_context else ""}

## YOUR TASK
Using real-time Google Search data, analyze:

1. **Current Market Status**: Search for these hashtags and similar trends. Are they currently hot, declining, or saturated?

2. **Competitive Landscape**: What similar campaigns or trends are currently active? Who are the key players?

3. **Viability Score (0-100)**: Rate this campaign's likely success based on:
   - Market saturation level
   - Audience fatigue indicators
   - Platform algorithm favorability
   - Timing appropriateness

4. **Predicted Lifecycle**: Estimate how long this trend/campaign will stay relevant before decline signals appear.

5. **Top 5 Risk Factors**: What could cause this campaign to fail or decline prematurely?
   Examples: Content Saturation, Event Expiry, Controversy Fatigue, Algorithm Shift, Influencer Exodus

6. **Optimization Recommendations**: 5 actionable strategies to maximize success and extend lifecycle.

7. **Optimal Launch Window**: When is the best time to launch this campaign?

8. **Similar Past Trends**: Reference 2-3 similar trends from the past and what happened to them.

## RESPONSE FORMAT
Return a JSON object with this structure:
{{
    "viability_score": 75,
    "market_status": "growing|saturated|declining|emerging",
    "predicted_lifecycle_days": 45,
    "competitive_analysis": {{
        "active_competitors": ["...", "..."],
        "market_saturation": "low|medium|high",
        "key_players": ["...", "..."]
    }},
    "risk_factors": [
        {{"risk": "Content Saturation", "severity": "high|medium|low", "mitigation": "..."}},
        ...
    ],
    "recommendations": ["...", "...", "...", "...", "..."],
    "optimal_launch_window": "Description of best timing",
    "similar_past_trends": [
        {{"name": "...", "outcome": "...", "lesson": "..."}}
    ],
    "platform_insights": {{
        "algorithm_favorability": "high|medium|low",
        "trending_formats": ["...", "..."],
        "avoid_formats": ["...", "..."]
    }},
    "summary": "2-3 sentence executive summary"
}}
"""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=self.generate_config,
            )
            
            # Extract text response
            response_text = response.text
            
            # Try to parse JSON from response
            try:
                # Find JSON in response
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                if start != -1 and end > start:
                    result = json.loads(response_text[start:end])
                    result["raw_analysis"] = response_text
                    result["analyzed_at"] = datetime.now().isoformat()
                    result["campaign_input"] = {
                        "topic": topic,
                        "hashtags": hashtags,
                        "platform": platform,
                        "campaign_aim": campaign_aim,
                        "target_audience": target_audience,
                        "planned_duration_days": planned_duration_days
                    }
                    return result
            except json.JSONDecodeError:
                pass
            
            # Fallback: return raw text
            return {
                "viability_score": 50,
                "raw_analysis": response_text,
                "analyzed_at": datetime.now().isoformat(),
                "parse_error": "Could not parse structured response"
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "analyzed_at": datetime.now().isoformat()
            }

    def deep_analyze_campaign(
        self,
        topic: str,
        hashtags: List[str],
        platform: str,
        campaign_aim: str,
        target_audience: str,
        planned_duration_days: int = 30
    ) -> Dict:
        """
        Deep analysis using Serper web search + Gemini AI.
        Provides real market data and underlying reasons.
        
        Returns:
            Comprehensive analysis with real search results and AI insights
        """
        from trendguard.explainability.serper_client import SerperClient
        
        result = {
            "topic": topic,
            "hashtags": hashtags,
            "platform": platform,
            "analyzed_at": datetime.now().isoformat(),
            "market_research": {},
            "competitor_analysis": {},
            "risk_analysis": {},
            "ai_insights": {}
        }
        
        try:
            serper = SerperClient()
            
            # 1. Search for current market trends
            hashtag_str = " ".join(hashtags[:3])
            market_query = f"{topic} {platform} trend 2024 2025"
            market_news = serper.search_news(market_query, 5)
            
            result["market_research"] = {
                "query": market_query,
                "news": market_news,
                "summary": f"Found {len(market_news)} recent articles about this topic"
            }
            
            # 2. Search for competitors
            competitor_query = f"{topic} {platform} brand campaign"
            competitor_results = serper.search_web(competitor_query, 5)
            
            result["competitor_analysis"] = {
                "query": competitor_query,
                "results": competitor_results,
                "active_brands": [r.get("title", "") for r in competitor_results[:3]]
            }
            
            # 3. Search for potential risks/controversies
            risk_query = f"{topic} controversy OR backlash OR criticism"
            risk_news = serper.search_news(risk_query, 3)
            
            result["risk_analysis"] = {
                "query": risk_query,
                "controversies": risk_news,
                "risk_level": "high" if len(risk_news) > 2 else "medium" if len(risk_news) > 0 else "low"
            }
            
            # 4. Search social discussions
            social_results = serper.search_social_discussions(topic)
            result["social_discussions"] = social_results
            
        except Exception as e:
            result["search_error"] = str(e)
            # Continue with AI analysis even if Serper fails
        
        # 5. Generate AI insights based on search results
        try:
            context_parts = []
            
            if result.get("market_research", {}).get("news"):
                context_parts.append("MARKET NEWS:")
                for news in result["market_research"]["news"][:3]:
                    context_parts.append(f"- {news.get('title', '')}: {news.get('snippet', '')}")
            
            if result.get("risk_analysis", {}).get("controversies"):
                context_parts.append("\nCONTROVERSIES/RISKS:")
                for risk in result["risk_analysis"]["controversies"]:
                    context_parts.append(f"- {risk.get('title', '')}: {risk.get('snippet', '')}")
            
            if result.get("competitor_analysis", {}).get("results"):
                context_parts.append("\nCOMPETITORS:")
                for comp in result["competitor_analysis"]["results"][:3]:
                    context_parts.append(f"- {comp.get('title', '')}")
            
            search_context = "\n".join(context_parts)
            
            prompt = f"""You are a marketing strategist. Based on real search data, provide campaign insights.

## CAMPAIGN DETAILS
- Topic: {topic}
- Hashtags: {", ".join(hashtags)}
- Platform: {platform}
- Campaign Aim: {campaign_aim}
- Target Audience: {target_audience}
- Duration: {planned_duration_days} days

## REAL SEARCH DATA
{search_context}

## YOUR ANALYSIS

Based on the REAL search data above, provide:

1. **Market Status**: Is this market saturated, growing, or emerging? Why?
2. **Timing Assessment**: Is NOW a good time to launch? What recent events affect this?
3. **Competitor Threat**: Who are the main competitors and what are they doing?
4. **Risk Factors**: What real controversies or risks should they avoid?
5. **Opportunity Windows**: What gaps or opportunities exist?
6. **Recommendations**: 3 specific, actionable strategies based on the data.

Return a JSON object:
{{
    "viability_score": 75,
    "market_status": "growing|saturated|emerging|declining",
    "timing_verdict": "optimal|acceptable|risky|avoid",
    "timing_reason": "Explanation based on real data",
    "main_competitors": ["competitor1", "competitor2"],
    "competitor_insights": "What competitors are doing",
    "real_risks": [
        {{"risk": "Name", "source": "From search", "mitigation": "How to avoid"}}
    ],
    "opportunities": ["opportunity1", "opportunity2"],
    "recommendations": [
        {{"action": "Specific action", "reason": "Why this works", "priority": "high|medium|low"}}
    ],
    "similar_campaigns": ["Example1", "Example2"],
    "predicted_lifecycle_days": 45,
    "confidence": 0.85,
    "summary": "2-3 sentence executive summary based on real data"
}}
"""

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=self.generate_config,
            )
            
            response_text = response.text
            
            try:
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                if start != -1 and end > start:
                    ai_insights = json.loads(response_text[start:end])
                    result["ai_insights"] = ai_insights
                    result["viability_score"] = ai_insights.get("viability_score", 50)
                    result["summary"] = ai_insights.get("summary", "")
            except json.JSONDecodeError:
                result["ai_insights"] = {"raw": response_text}
                
        except Exception as e:
            result["ai_error"] = str(e)
        
        return result
    
    def check_trend_health(self, trend_name: str) -> Dict:
        """
        Quick health check on an existing trend using real-time search.
        
        Args:
            trend_name: Name of the trend or hashtag to analyze
            
        Returns:
            Health status and current metrics
        """
        
        prompt = f"""Analyze the current health status of this social media trend: "{trend_name}"

Using Google Search, find:
1. Is this trend currently growing, peaking, declining, or dead?
2. What's the current engagement level?
3. Are there any controversies or negative sentiment?
4. Who are the main creators/influencers still participating?
5. What platforms is it most active on?

Return a JSON object:
{{
    "trend_name": "{trend_name}",
    "health_status": "growing|peaking|declining|dead|emerging",
    "health_score": 75,
    "sentiment": "positive|neutral|negative|mixed",
    "active_platforms": ["...", "..."],
    "key_creators": ["...", "..."],
    "recent_news": ["...", "..."],
    "decline_signals": ["...", "..."],
    "recommendation": "Continue investing|Reduce exposure|Exit immediately|Monitor closely"
}}
"""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=self.generate_config,
            )
            
            response_text = response.text
            
            try:
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                if start != -1 and end > start:
                    result = json.loads(response_text[start:end])
                    result["checked_at"] = datetime.now().isoformat()
                    return result
            except json.JSONDecodeError:
                pass
            
            return {
                "trend_name": trend_name,
                "raw_analysis": response_text,
                "checked_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def compare_hashtags(self, hashtags: List[str], platform: str = "instagram") -> Dict:
        """
        Compare multiple hashtags to find the best performing ones.
        
        Args:
            hashtags: List of hashtags to compare
            platform: Target platform
            
        Returns:
            Ranked comparison of hashtags
        """
        
        hashtag_str = ", ".join(hashtags)
        
        prompt = f"""Compare these hashtags for a {platform} campaign: {hashtag_str}

For each hashtag, search and determine:
1. Current popularity/volume
2. Competition level
3. Engagement rate trend
4. Risk of saturation
5. Recommended or not

Return a JSON object:
{{
    "platform": "{platform}",
    "comparison": [
        {{
            "hashtag": "...",
            "popularity_score": 85,
            "competition": "low|medium|high",
            "trend_direction": "up|stable|down",
            "saturation_risk": "low|medium|high",
            "recommended": true,
            "reason": "..."
        }}
    ],
    "best_combination": ["...", "...", "..."],
    "avoid": ["..."],
    "strategy_tip": "..."
}}
"""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=self.generate_config,
            )
            
            response_text = response.text
            
            try:
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                if start != -1 and end > start:
                    return json.loads(response_text[start:end])
            except json.JSONDecodeError:
                pass
            
            return {"raw_analysis": response_text}
            
        except Exception as e:
            return {"error": str(e)}

    def explain_metrics(
        self,
        trend_name: str,
        current_metrics: Dict[str, float],
        peak_metrics: Optional[Dict[str, float]] = None,
        archetype: Optional[str] = None
    ) -> Dict:
        """
        Analyze WHY metrics changed and provide actionable insights.
        
        Args:
            trend_name: Name of the trend
            current_metrics: Current values (velocity, fatigue, retention, etc.)
            peak_metrics: Optional peak values for comparison
            archetype: Trend archetype (viral_crash, slow_burn, etc.)
            
        Returns:
            Detailed explanation of metric changes and causes
        """
        
        # Calculate deltas if peak metrics provided
        deltas = {}
        if peak_metrics:
            for key in current_metrics:
                if key in peak_metrics and peak_metrics[key] != 0:
                    delta = ((current_metrics[key] - peak_metrics[key]) / peak_metrics[key]) * 100
                    deltas[key] = round(delta, 1)
        
        metrics_str = "\n".join([f"- {k}: {v:.2f}" for k, v in current_metrics.items()])
        deltas_str = "\n".join([f"- {k}: {v:+.1f}%" for k, v in deltas.items()]) if deltas else "No comparison available"
        
        prompt = f"""You are a social media analytics expert. Analyze why this trend's metrics changed.

## TREND: {trend_name}
## ARCHETYPE: {archetype or 'Unknown'}

## CURRENT METRICS:
{metrics_str}

## CHANGES FROM PEAK:
{deltas_str}

## YOUR ANALYSIS

For each metric, explain:
1. **What it means**: What does this metric value indicate?
2. **Why it changed**: What caused the increase/decrease?
3. **Impact**: How does this affect the trend's future?
4. **Action**: What should be done about it?

Return a JSON object:
{{
    "trend_name": "{trend_name}",
    "overall_health": "healthy|warning|critical",
    "metric_analysis": {{
        "velocity": {{
            "value": 0.25,
            "status": "declining|stable|growing",
            "explanation": "Why velocity is at this level",
            "cause": "Root cause of change",
            "impact": "What this means for the trend",
            "action": "Recommended action"
        }},
        "fatigue": {{...}},
        "retention": {{...}}
    }},
    "causal_chain": "A → B → C explanation of what happened",
    "recovery_possible": true,
    "recovery_actions": ["action1", "action2", "action3"],
    "predicted_outcome": "What will happen if no action taken",
    "confidence": 0.85
}}
"""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=self.generate_config,
            )
            
            response_text = response.text
            
            try:
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                if start != -1 and end > start:
                    result = json.loads(response_text[start:end])
                    result["analyzed_at"] = datetime.now().isoformat()
                    result["input_metrics"] = current_metrics
                    result["deltas"] = deltas
                    return result
            except json.JSONDecodeError:
                pass
            
            return {
                "raw_analysis": response_text,
                "analyzed_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"error": str(e)}

    def analyze_post(
        self,
        image_data: bytes,
        mime_type: str = "image/jpeg",
        caption: Optional[str] = None,
        hashtags: Optional[List[str]] = None,
        platform: str = "instagram"
    ) -> Dict:
        """
        Analyze a campaign post image/video using Gemini vision.
        
        Args:
            image_data: Raw bytes of the image
            mime_type: MIME type (image/jpeg, image/png, video/mp4)
            caption: Optional post caption
            hashtags: Optional hashtags
            platform: Target platform
            
        Returns:
            Post analysis with engagement predictions
        """
        
        context = f"""
Caption: {caption or 'None provided'}
Hashtags: {', '.join(hashtags) if hashtags else 'None provided'}
Platform: {platform}
"""
        
        prompt = f"""Analyze this social media post for a {platform} campaign.

{context}

Evaluate:
1. **Visual Appeal**: Color scheme, composition, quality
2. **Content Type**: Product, lifestyle, meme, educational, etc.
3. **Engagement Potential**: Will this get likes, comments, shares?
4. **Target Audience Match**: Who will this resonate with?
5. **Trend Alignment**: Does it fit current trends?
6. **Improvement Suggestions**: How to make it better?

Return a JSON object:
{{
    "visual_score": 85,
    "content_type": "lifestyle|product|meme|educational|inspirational",
    "predicted_engagement": "high|medium|low",
    "engagement_score": 75,
    "target_audience": "Description of who this appeals to",
    "strengths": ["...", "...", "..."],
    "weaknesses": ["...", "..."],
    "improvements": ["...", "...", "..."],
    "best_posting_time": "When to post this",
    "hashtag_suggestions": ["#suggested1", "#suggested2"],
    "caption_suggestions": "Optional improved caption",
    "trend_fit": "high|medium|low",
    "viral_potential": 0.65
}}
"""

        try:
            # Create content parts with image
            parts = [
                types.Part.from_bytes(data=image_data, mime_type=mime_type),
                types.Part.from_text(text=prompt)
            ]
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=parts,
                config=types.GenerateContentConfig(
                    safety_settings=self.generate_config.safety_settings
                )
            )
            
            response_text = response.text
            
            try:
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                if start != -1 and end > start:
                    result = json.loads(response_text[start:end])
                    result["analyzed_at"] = datetime.now().isoformat()
                    result["platform"] = platform
                    return result
            except json.JSONDecodeError:
                pass
            
            return {
                "raw_analysis": response_text,
                "analyzed_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"error": str(e)}


# --- CLI TESTING ---
if __name__ == "__main__":
    print("🧪 Testing Gemini Campaign Advisor")
    print("=" * 50)
    
    try:
        advisor = CampaignAdvisor()
        
        # Test campaign analysis
        print("\n📊 Analyzing sample campaign...")
        result = advisor.analyze_campaign(
            topic="Summer Fashion Drop 2025",
            hashtags=["#SummerVibes", "#OOTD", "#Fashion2025", "#StreetStyle"],
            platform="instagram",
            campaign_aim="Launch new streetwear collection targeting Gen Z",
            target_audience="18-25 year olds interested in fashion and lifestyle",
            planned_duration_days=45
        )
        
        print(f"\n✅ Viability Score: {result.get('viability_score', 'N/A')}")
        print(f"📈 Market Status: {result.get('market_status', 'N/A')}")
        print(f"⏱️ Predicted Lifecycle: {result.get('predicted_lifecycle_days', 'N/A')} days")
        
        if result.get('recommendations'):
            print("\n💡 Recommendations:")
            for i, rec in enumerate(result['recommendations'][:3], 1):
                print(f"   {i}. {rec}")
        
        if result.get('risk_factors'):
            print("\n⚠️ Risk Factors:")
            for rf in result['risk_factors'][:3]:
                print(f"   • {rf.get('risk', rf)} ({rf.get('severity', 'unknown')})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure GEMINI_API_KEY is set and google-genai is installed")
