from openai import OpenAI

model_name = "facebook/blenderbot-400M-distill"
MAX_LENGTH=150

client = OpenAI(
    api_key="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"
)
converstaion_history=[]

def main():
    completion=client.chat.completions.create(
        model="gpt-4o-mini",    
        messages=[
            {"role":"system","content":"You are an expert on the NHL and the statistics of its players"},
            {"role":"user","content":"Give me data comparing Claude Giroux and Sidney Crosby corsi numbers over the last 10 years (up to the 2023-2024 season). Give me the data in JSON format"}
        ]
    )
    print(completion.choices[0].message)

if __name__ == "__main__":
    main()