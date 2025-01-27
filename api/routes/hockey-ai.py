from openai import OpenAI
import sys

##OpenAI ChatGPT Implementation

# client = OpenAI(
#     api_key="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"
# )

# def main():
#     completion=client.chat.completions.create(
#         model="gpt-4o-mini",    
#         messages=[
#             {"role":"system","content":"You are an expert on the NHL and the statistics of its players"},
#             {"role":"user","content":"Give me data comparing Claude Giroux and Sidney Crosby corsi numbers over the last 10 years (up to the 2023-2024 season). Give me the data in JSON format"}
#         ]
#     )
#     print(completion.choices[0].message)


## DeepSeek Implementation

client = OpenAI(api_key="sk-26e40f3bb4b547fe88ab7c23bb42df8f", base_url="https://api.deepseek.com")

def main(message):

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role":"system", "content":"You are an expert in the NHL and the sport of hockey"},
            {"role":"user","content":message}
        ],
        stream=False
    )
    print(response.choices[0].message.content)
    return response.choices[0].message.content

if __name__ == "__main__":
    message = sys.argv[1]
    main(message)