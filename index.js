require('dotenv').config();
const { OpenAI } = require('openai');
const { exec } = require('child_process');
const { error } = require('console');
const { stderr, stdout } = require('process');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log('OPENAI_API_KEY:', OPENAI_API_KEY);
const fs = require('fs').promises;
const path = require('path');
let currentWorkingDir = process.cwd(); // default directory
const client = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

const TOOLS_MAP = {
    executeCommand : executeCommand,
};


// execute command v1

// function executeCommand(command){
//    return new Promise((resolve, reject) => {
//           exec(command , (error , stdout , stderr)=> {
//             if(error){
//                 return reject(`Error executing command: ${error.message}`);
//             }

//             resolve(`stdout: ${stdout}\nstderr: ${stderr}`);
//           });
//    })
// }



// execute command v2

async function executeCommand(command) {
    const writeFileRegex = /^echo\s+"([\s\S]*)"\s+>\s+(.*)$/;

    // Intercept echo-based file writes
    const match = command.match(writeFileRegex);
    if (match) {
        const content = match[1]
            .replace(/\\"/g, '"')  // unescape quotes
            .replace(/\\n/g, '\n'); // support newline escaping if needed
        const filePath = match[2].trim();

        try {
            const fullPath = path.resolve(filePath);
            await fs.writeFile(fullPath, content, 'utf8');
            return `File ${filePath} written successfully.`;
        } catch (err) {
            throw new Error(`Failed to write file ${filePath}: ${err.message}`);
        }
    }

    // Otherwise, run as shell command
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(`Error executing command: ${error.message}`);
            }
            resolve(`stdout: ${stdout}\nstderr: ${stderr}`);
        });
    });
}



// const SYSTEM_PROMPT = `You are a helpful AI Assistant who is designed to resolve user query. 
//                        You work on START ,THINK , OBSERVE and OUTPUT Mode.

//                        In the start phase , user gives a query to you.
//                        Then , you THINK how to resolve that query atleast 3-4 times and make sure that all is clear.
//                        If there is a need to call a tool , you call an ACTION event with tool and input parameters.
//                        If there is an action call , wait for the OBSERVE that is the output of the tool.
//                        Based on the OBSERVE from prev step , you either output or repeat the loop.
// Rules:
// - Always wait for the next step.
// - Always output a single step and wait for the next step.
// - Output must be strictly JSON.
// - Only call tool action from Available tools only.
// - Strictly follow the output format in JSON.

// Available tools:
// - executeCommand(command): string -> Executes a given linux command on user's device and returns the STDOUT and STDERR.

// Example:
// START : What is weather in Patiala?
// THINK : The user is asking about the weather in Patiala.
// THINK : From the available tools , I must call getWeatherInfo tool for patiala as input.
// ACTION : Call Tool getWeatherInfo(patiala).
// OBSERVE : 32 degree celsius.
// THINK : The output of getWeatherInfo for patiala is 32 degrees celsius.
// OUTPUT : Hey , The weather in patiala is 32 Degree C which is quite hot.

// Output Example:
// {"role" : "user" , "content" : "What is the weather in Patiala?"}
// {"step" : "think" , "content" : "The user is asking about the weather in Patiala."}
// {"step" : "think" , "content" : "From the available tools , I must call getWeatherInfo tool for patiala as input."}
// {"step" : "action" , "tool" : "getWeatherInfo" , "input" : "patiala"}
// {"step" : "observe" , "content" : "32 degree celsius."}
// {"step" : "think" , "content" : "The output of getWeatherInfo for patiala is 32 degrees celsius."}
// {"step" : "output" , "content" : "Hey , The weather in patiala is 32 Degree C which is quite hot."}


// Output Format:
// {"step" : "string" , "tool" : "string" , input : "string" , "content" : "string} 
// `;

 const SYSTEM_PROMPT = `You are an helpful AI Assistant who is designed to reolve user query.
                        You work on START ,THINK , OBSERVE and OUTPUT Mode.
                        
                        In the start phase , user gives a query to you.
                        Then , you THINK how to resolve that query atleast 3-4 times and make sure that all is clear.
                        If there is a need to call a tool , you call an ACTION event with tool and input parameters.
                        If there is an action call , wait for the OBSERVE that is output of the tool.
                        Based on the OBSERVE from the prev step , you either output or repeat the loop.

                        Rules:
                        - Always wait for the next step.
                        - Always output a single step and wait for the next step.
                        - Output must be strictly JSON.
                        - Only call tool action from Available tools only.
                        - Strictly follow the output format in JSON.


                        Available Tools:
                        - executeCommand(command) : string -> Executes a given linux command on user's device and returns the STDOUT and STDERR.

                        EXAMPLE:
                        START : What is weather in Patiala?
                        THINK : The user is asking about the weather in Patiala.
                        THINK : From the available tools , I must call getWeatherInfo tool for patiala as input.
                        ACTION : Call Tool getWeatherInfo(patiala).
                        OBSERVE: 32 Degree C.
                        THINK : The output of getWeatherInfo for patiala is 32 degrees celsius.
                        OUTPUT : Hey , The weather of Patiala is 32 Degree C which is quite hot.


                        Output Example:
                        {"role" : "user" , "content" : "What is the weather in Patiala?"}
                        {"step" : "think" , "content" : "The user is asking for the weather in Patiala."}
                        {"step" : "think" , "content" : "From the available tools , I must call getWeatherInfo tool for patiala as input."}
                        {"step" : "action" , "tool" : "getWeatherInfo" , "input" : "patiala"}
                        {"step" : "observe" , "content" : "32 Degree C."}
                        {"step" : "think" , "content" : "The output of getWeatherInfo for patiala is 32 degrees celsius."}
                        {"step" : "output" , "content" : "Hey , The weather in patiala is 32 Degree C which is quite hot."}

                        Output Format:
                        {"step" : "string" , "tool" : "string" , input : "string" , "content" : "string"}
                        `;

async function init(){
try {
    const messages = [
       {
            role : 'assistant',
            content : SYSTEM_PROMPT
        }
   ];

    const userQuery = 'Prompt of your choice here';

    messages.push({
        role : 'user',
        content : userQuery
    });


    while(true) {
        const response = await client.chat.completions.create({
            model : 'gpt-4o',
            response_format : {type: 'json_object'},
            messages: messages,
        });

        messages.push({ role:'assistant' , content: response.choices[0].message.content });

        const parsed_response = JSON.parse(response.choices[0].message.content);
        
        //If the step is start , we are starting the process and we can output the first step.
        if(parsed_response.step && parsed_response.step === 'think') {
            console.log(`🧠:${parsed_response.content}`);
             continue;
        }
        //If the step is output , we are done with the process and we can output the final result.
         if(parsed_response.step && parsed_response.step === 'output') {
            console.log(`🤖:${parsed_response.content}`);
             break;
        }

        //We are basically fetching the tool and input from the parsed response and then we'll call the tool from the toolsmap by passing the input.
        if(parsed_response.step && parsed_response.step === 'action') 
        {
           const tool = parsed_response.tool; 
           const input = parsed_response.input;

           const value = await TOOLS_MAP[tool](input);

           console.log(`🔧:Calling tool ${tool} with input ${input} with value => ${value}`);

            messages.push({"role" : 'assistant' , "content":  JSON.stringify({"step": "observe" , "content": value}) 
            });

            continue;
        } 
    }
} catch (error) {
    console.error('Error:', error);
}
}


init();
 