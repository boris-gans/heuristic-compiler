![fig_0](images/img_000.png)

![fig_1](images/img_001.png)

## AI: NATURAL LANGUAGE PROCESSING & SEMANTIC ANALYSIS

BCSAI JAN-2025

PROF. DR. JUANJO MANJARÍN



---



![fig_2](images/img_002.png)

## SESSION 7: INFORMATION RETRIEVAL AND STATISTICAL RELEVANCE

Relevance without Understanding

![fig_3](images/img_003.png)



---



![fig_4](images/img_004.png)

## SESSION CONTENTS

- What is Information Retrieval
- Queries vs. Documents
- What Does ' Relevance ' Mean?
- Relevance Feedback and the Residual Collection
- From Language to Comparison
- Vector Space View of Retrieval
- Term Weighting as Information
- TF -IDF Revisited
- From Document Relevance to Word Relevance
- Next-Word Prediction Without Understanding
- Limits of Statistical Relevance
- Practice

![fig_5](images/img_005.png)



---



![fig_6](images/img_006.png)

## WHAT IS INFORMATION RETRIEVAL

Information Retrieval addresses the problem of selecting relevant information from a large collection of documents.

Given a user query and a document corpus, the goal is to rank the documents according to how relevant they are to the query. The output of an Information Retrieval system is therefore not a single answer, but an ordered list of documents.

Importantly, Information Retrieval is not a task about understanding language in a human sense. It does not require the system to interpret meaning, intentions, or truth. It is fundamentally an ordering problem, where documents are compared and ranked based on measurable criteria.

![fig_7](images/img_007.png)



---



Information Retrieval focuses on selecting relev

internal content of the do le

## INFORMATION RETRIEVAL VS. INFORMATION EXTRACTION

Entity

Relation

Entity

We should be careful since there are two different topics that are, sometimes, confused: Information Retrieval and Information Extraction. This session focuses on Information Retrieval. Information Extraction will appear later as a different way of interacting with text.

## Information Retrieval

focuses on selecting relevant documents from a collection. The output is an ordered list of documents, and the internal content of the documents is not analysed beyond what is needed for ranking.

![fig_8](images/img_008.png)

## Information Extraction

focuses on identifying and structuring specific pieces of information within documents, such as entities, relations, or events. The goal is not to rank documents, but to transform unstructured text into structured representations.

![fig_9](images/img_009.png)

![fig_10](images/img_010.png)



---



ieval

Hovat ?

Research

Reports

How

Wrath

Who

What

Where

Piar u

-80

?

Articles

Data

SEARCH

le

## QUERIES VS. DOCUMENTS

There is a natural asymmetry between documents and queries central in the design of retrieval systems. Most retrieval techniques exist precisely to compensate for the fact that queries provide very little information, while documents contain far more information than is strictly necessary.

## Queries

- They encode a user ' s information expressed as a set of terms (lexical items that occur in a collection)
- They are typically short, ambiguous, and underspecified
- Usually consist of a few words and rely heavily on the implicit intentions of the user

![fig_11](images/img_011.png)

## Documents

- A document is generically the unit of text indexed in the system and available for retrieval
- They are typically longer, redundant and noisy
- It  may  refer  to  common  artifacts  like  newspaper  articles,  or  books,  but  it  may  refer  to  smaller  units  as paragraphs or sentences.
- A collection is a set of documents used to satisfy user requests

![fig_12](images/img_012.png)

D

![fig_13](images/img_013.png)



---



![fig_14](images/img_014.png)

## WHAT DOES 'R ELEVANCE ' MEAN?

Relevance is not an intrinsic property of a document. A document is  not relevant in isolation, but only relative to a query, a corpus, and a task. The same document may be relevant for one query and irrelevant for another.

In  practical  terms,  a  document  is  considered  relevant  if  it  shares informative terms with the query and if those terms help distinguish it from other documents in the collection. Relevance is therefore operational and context-dependent, not semantic in the strong sense.

![fig_15](images/img_015.png)



---



e used

Not Relevant

Relevance Feedback

In many retrieval systems, relevance is refined through interaction. After an initial ranking is produced, user feedback can be used to adjust the query representation. Documents marked as relevant reinforce certain terms, while non-relevant documents reduce their influence. This process is known as relevance feedback.

Through relevance feedback, the query effectively evolves. It becomes a better statistical representation of the user ' s information need, even if that need was only vaguely specified in the original query.

Al: Natural Language Processing

Formally we can write it via Rocchio-style update equation

![fig_16](images/img_016.png)

$$\vec { q } _ { i + 1 } = \vec { a } _ { i } + \frac { \beta } { R } \sum _ { j = 1 } ^ { R } \vec { r } _ { j } - \frac { \gamma } { S } \sum _ { j = 1 } ^ { S } \vec { s } _ { j }$$

Where 𝛽 represents how far the new vector should be pushed toward the relevant documents, and 𝛾 represents how far it should be pushed away from non-relevant documents; 𝑅 and 𝑆 are is the number of relevant and of non-relevant documents, respectively, from the original query; Ԧ 𝑞𝑖 is the old query, Ԧ 𝑞𝑖+1 the new query, Ԧ 𝑟 𝑖 and Ԧ 𝑠𝑖 are documents in the relevant and non-relevant sets.

This highlights an important point: relevance in Information Retrieval is not static. It is an  adaptive,  comparative  notion  that  depends  on  both  user  interaction  and  the structure of the remaining document collection.

Query

## RELEVANCE FEEDBACK AND THE RESIDUAL COLLECTION

SCHOOL OF

SCIENCE &

TECHNOLOGY

![fig_17](images/img_017.png)



---



![fig_18](images/img_018.png)

retrieval

In order to rank documents, language must be transformed into a form  that  allows  comparison.  This  requires  representing  both queries  and  documents  numerically,  so  that  similarity  can  be computed.

TF -IDF provides a weighting scheme that makes this comparison meaningful.  Term  Frequency  captures  how  important  a  word  is within  a  document,  while  Inverse  Document  Frequency  reduces the influence of words that appear across many documents in the collection.

The  role  of  TF -IDF  is  therefore  not  to  model  meaning,  but  to improve discrimination. It emphasizes words that help distinguish one document from others with respect to a query.

120

## TF-IDF REVISITED

questions

![fig_19](images/img_019.png)



---



![fig_20](images/img_020.png)

## TF -IDF, SURPRISE, AND CROSS-ENTROPY

The  weighting behaviour of  TF -IDF reflects a  more  general principle: informative events are those that are statistically unexpected.

Words  that  appear  in  almost  every  document  are  expected  and therefore  carry  little  information.  Words  that  are  rare  across  the collection are more surprising and carry more information.

This  intuition  is  closely  related  to  the  notion  of  cross-entropy. Cross-entropy measures how unexpected observed data are under a  given  probabilistic  model.  When  observed  words  are  assigned low  probability,  surprise  is  high;  when  they  are  assigned  high probability, surprise is reduced.

Although  TF -IDF  is  not  a  probabilistic  model,  it  anticipates  this idea  by  rewarding  statistically  surprising  words  and  penalizing predictable ones.

![fig_21](images/img_021.png)



---



- Lp(x) log q(x)

## CROSS-ENTROPY AS A LEARNING OBJECTIVE

![fig_22](images/img_022.png)

In  probabilistic language models, the goal is often to minimize crossentropy between the model ' s predicted distribution and the observed data.  Doing  so  encourages  the  model  to  assign  high  probability  to words that actually appear and low probability to words that do not.

This objective formalizes the same  intuition already present in statistical relevance models: good models reduce surprise on real data. What changes is not the principle, but the level of formalization and expressiveness of the model.

When  next-word  prediction  is  framed  probabilistically,  selecting  the next word corresponds to choosing the word that minimizes expected surprise  given  the  context.  This  makes  next-word  prediction  a  direct operationalization of the cross-entropy principle.

Seen from this perspective, statistical relevance, TF -IDF weighting, and probabilistic  language  modelling  are  not  disconnected  techniques. They are successive refinements of the same underlying idea: modelling language by controlling surprise.

![fig_23](images/img_023.png)



---



![fig_24](images/img_024.png)

## FROM DOCUMENT RELEVANCE TO WORD RELEVANCE

The same statistical logic used for document retrieval can be applied at the level of words. Instead of asking which document is most relevant to  a  query,  we  can  ask  which  words  are  most  relevant  to  a  given context.

By treating the context as a bag of words, candidate next words can be ranked according to their statistical association with that context. This reframes retrieval mechanisms as very simple language models.

Using  only  statistical  relevance,  it  is  possible  to  generate  plausible next-word  predictions.  The  system  ranks  candidate  words  based  on their  association  with  the  context  and  selects  the  most  statistically relevant one.

This process can produce fluent-looking text without modelling syntax, intention,  or  meaning.  The  resulting  behaviour  may  appear  coherent locally, but it does not involve understanding in any substantive sense.

![fig_25](images/img_025.png)



---



![fig_26](images/img_026.png)

Statistical

Relevance

## LIMITS OF STATISTICAL RELEVANCE

Statistical relevance models have clear limitations:

- They  do  not  capture  word  order,  compositional  meaning, paraphrase equivalence, or world knowledge.
- They operate entirely on surface-level patterns of usage.

As a result, effective language behaviour does not imply semantic understanding.

These  limitations  motivate  the  development  of  more  expressive models,  but  they  do  not  invalidate  the  usefulness  of  statistical approaches for tasks such as retrieval.

Meaning

Semantics

![fig_27](images/img_027.png)



---



## PRACTICE ASSIGNMENT: YOUR CHATBOT (NOT GRADED)

SCIENCE &

TECHNOLOGY

![fig_28](images/img_028.png)

In the practice session, you will work with a small document collection and apply  TF -IDF-based  word-relevance  measures  to  design  a  chatbot  in  the ELIZA style.

## The required tasks are:

- Write down the algorithm that may let you create such chatbot
- Discuss the critical points of the algorithm
- Implement the chatbot in Python

The second task is a natural extension, and the main idea is to understand the required conditions, constraints and limitations of this construction.

![fig_29](images/img_029.png)