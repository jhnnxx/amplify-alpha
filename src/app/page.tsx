'use client'
import { Amplify, API, graphqlOperation} from 'aws-amplify';
import awsExports from "@/aws-exports";
import {useEffect, useState} from "react";
import {listTweets} from "@/graphql/queries";
import {createTweet} from "@/graphql/mutations"
import {GraphQLResult} from "@aws-amplify/api-graphql";
import {onCreateTweet} from "@/graphql/subscriptions"
import {Observable} from "zen-observable-ts";
Amplify.configure(awsExports)

interface Tweet {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export default function Home() {
  const [formData, setFormData] = useState({
    author: '',
    text: '',
  })
  const onChange = (e: any) => {
    const { target: { name, value } } = e
    setFormData((prv) => ({ ...prv, [name]: value }));
  }
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const fetchTweets = async () => {
    const req = API.graphql(graphqlOperation(listTweets)) as unknown as Promise<GraphQLResult<any>>;
    req.then((res) => setTweets(res?.data?.listTweets?.items))
  }
  const realtimeTweets = () => {
    const req = API.graphql(graphqlOperation(onCreateTweet)) as unknown as Observable<{ value: { data: { onCreateTweet: Tweet }} }>
    req.subscribe({
      next: ({ value }) => {
        if (value?.data?.onCreateTweet) {
          setTweets((prv) => [{...value?.data.onCreateTweet}, ...prv])
        }
      }
    })
  }
  useEffect(() => {
    fetchTweets()
    realtimeTweets()
  }, [])
  const onSubmit = async (e: any) => {
    e.preventDefault();
    await API.graphql(graphqlOperation(createTweet, { input: formData }))
  }
  return (
    <main className={'container'}>
      <h1 className={`!text-sm`}>JHNN<span className={`text-4xl`}>X</span></h1>
      <section>
        <h3>Say Something 😎</h3>
        <form onSubmit={onSubmit}>
          <input
            type={'text'}
            name={'author'}
            placeholder={'What is your name?'}
            required={true}
            onChange={onChange}
            value={formData.author}
          />
          <textarea
            name={'text'}
            required={true}
            placeholder={'blah blah?'}
            onChange={onChange}
            value={formData.text}
          />
          <button className={`w-full !bg-pink-400 !border-pink-400`}>Post</button>
        </form>
      </section>
      <hr />
      <section>
        <h3>Timeline</h3>
        <div>
          {tweets
            ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            ?.map((tweet: Tweet) => (
            <article key={tweet.id}>
              <hgroup className={`flex !mb-0 items-center justify-between w-full`}>
                <h4 className={`!text-lg`}>{tweet.text}</h4>
                <h5 className={`!text-sm`}>{tweet.author}</h5>
              </hgroup>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
