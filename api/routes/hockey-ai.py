from openai import OpenAI
import sys
import json
import logging
import asyncio
from config import OPENAI_API_KEY,DEEPSEEK_API_KEY

logging .basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr)
        # logging.FileHandler('app.log'),
        # logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def call_api(aiClient, aiModel, message):
    try:
        response = aiClient.chat.completions.create(
        model=aiModel,
        messages=[
            {"role":"system", "content":"You are an expert in the NHL and the sport of hockey"},
            {"role":"user","content":message}
        ],
        stream=False
        )

        if response and response.choices:
            content = response.choices[0].message.content
            if content:
                return content
            else:
                raise ValueError("Empty content in API response")
        else:
            raise ValueError("Invalid API response structure")
    except ValueError as ve:
        logger.error("ValueError: %s", str(ve))
    except json.JSONDecodeError as je:
        logger.error("JSONDecodeError: %s", str(je))
    except Exception as e:
        logger.error("An error has occured: %s", str(e))
    return False
async def make_api_call(client, model, message):
    data = await asyncio.to_thread(call_api, client, model, message)
    return data
async def main(message):
    clients = [
        (OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com"), "deepseek-chat"),
        (OpenAI(api_key=OPENAI_API_KEY), "gpt-4o-mini")
    ]
    for client, model in clients:
        try:
            data = await make_api_call(client, model, message)
            if data is not False:
                output = json.dumps({"data":data})
                return output
        except Exception as e:
            continue
    logger.error("All API calls failed")  
    sys.exit(1)

if __name__ == "__main__":
    if sys.argv[1] != "":
        message = sys.argv[1]
        try:
            data = asyncio.run(main(message))
            if data:
                sys.stdout.write(data)
            else:
                sys.stdout.write(json.dumps({"error":"No data returned"}))
        except Exception as e:
            sys.stdout.write(json.dumps({"error": str(e)}))
    else:
        logger.error("No message was provided")
        sys.stdout.write(json.dumps({"error":"message was provided"}))
        sys.exit(1)