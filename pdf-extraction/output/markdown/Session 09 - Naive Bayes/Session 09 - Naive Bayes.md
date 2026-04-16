![fig_0](images/img_000.png)

![fig_1](images/img_001.png)

## AI: NATURAL LANGUAGE PROCESSING & SEMANTIC ANALYSIS

BCSAI JAN-2025

PROF. DR. JUANJO MANJARÍN



---



![fig_2](images/img_002.png)

## SESSION 9: NAÏVE BAYES

The simplest classifier

![fig_3](images/img_003.png)



---



![fig_4](images/img_004.png)

## SESSION CONTENTS

- Naïve Bayes and Text Classification
- Classification in NLP
- Evaluation of Classifiers
- Confusion matrix
- Metrics
- Can accuracy be misleading?
- Bayes' Formula
- Bayes' Classifier
- Naïve Bayes: the Independence Assumption
- Log-probabilities and Laplace Smoothing
- Practice

![fig_5](images/img_005.png)



---



![fig_6](images/img_006.png)

## NAÏVE BAYES AND TEXT CLASSIFICATION

So  far,  we  have  learned  how  to  transform  text  into  structured numerical objects: tokens, bag-of-words representations, and term -document matrices. The key change in this session is that we now  use  those representations to decide which  category a document belongs to.

In  this  session  we  introduce  Naïve  Bayes  as  the  first  full  text classifier in the course. The goal is to move from representing text statistically  to  making  categorical  decisions  under  uncertainty, using probabilistic reasoning

129

![fig_7](images/img_007.png)



---



![fig_8](images/img_008.png)

## CLASSIFICATION IN NLP

By definition, a classification problem is a supervised learning case in which the response variable is categorical. This means that our estimations  will  correspond  to  the  conditional  probabilities  that the  observations  belong  to  a  particular  level  of  that  categorical variable.

In  every  classification  task,  the  classifier  assigns  a  label  to  each document/observation from a predefined set of categories, without  any  reference  to  understanding  or  meaning:  there  is  a decision boundary found and a probability assigned.

Examples  of  classifiers can  be:  deciding  if  an  observation  is male/female, if the customers will/will not buy a product, or if a passenger  in  the  Titanic  survived/did  not  survive.  Specifically,  in NLP  we  have  cases  as  filtering  if  an  email  is  spam/no  spam, sentiment analysis, or customer feedback from reviews.

Spam filtering is one of the most classical NLP classification tasks: it  involves  short  texts,  binary  labels,  strong  class  imbalance,  and operational decisions.

![fig_9](images/img_009.png)



---



![fig_10](images/img_010.png)

## CONFUSION MATRIX

Positive

Before choosing a model, we  must  decide how  success is measured  since  different  types  of  errors  have  different  practical consequences, so relying on a single metric can be misleading.

All evaluation metrics are derived from  the  fact that every prediction  in  a  binary  classifier  falls  into  one  of  four  cases:  True Positive,  False  Positive,  True  Negative,  False  Negative.  Which  can be arranged in the so-called Confusion matrix.

Arranging  the  values  in  the  crosstab  below  we  immediately determine five different metrics

|      |          | Predicted       | Predicted       |
|------|----------|-----------------|-----------------|
|      |          | Negative        | Positive        |
| True | Negative | True Negatives  | False Positives |
| True | Positive | False Negatives | True Positives  |

![fig_11](images/img_011.png)

131



---



## CORE EVALUATION METRICS

ie

UNIVERSITY

SCHOOL OF

SCIENCE &

TECHNOLOGY

Considering the rates along rows and columns in the confusion matrix we can determine e predictions

ositives true positives

egatives

Precision:  Measures  how  reliable  positive  predictions are True Negatives precision = True Positives True Positives + False Positives precision =

Recall  (Sensitivity):  Measures  how  many  true  positives are recovered precision = True Positives True Positives + False Negatives

Specificity: Measures how well negatives are detected.

precision = True Negatives True Negatives + False Positives

![fig_12](images/img_012.png)

Negative Predictive Value: Measures how reliable negative predictions are precision = True Negatives True Negatives + False Negatives

132

![fig_13](images/img_013.png)

![fig_14](images/img_014.png)



---



le

UNIVERSITY

![fig_15](images/img_015.png)

AI: Natural Language Processing

## CORE EVALUATION METRICS

We  have  an  overall  metric  that  determines  the  proportion  of correct  predictions:  Accuracy,  which  is  the  most  widely  used  to determine

$$accuracy = \frac { \text {True Positive} + \text {True Negative} } { \text {Sample Size} }$$

However, we  must be very careful with this one since in imbalanced  datasets,  a  classifier  can  achieve  high  accuracy  by always predicting the majority class.

Such  a  classifier  may  be  useless  in  practice  despite  its  apparent performance.

![fig_16](images/img_016.png)



---



le

Random Classifier:

This is the most basic, simple, and wrong case we may use. It simply amounts to label randomly the observations from our

set. We are going to define the function that may do this no

## BASELINE MODELS

Previ

This label

the c label

This value

class

We will have two reference models that we will use to compare our classifier. For short: if our model does not perform better than them, we can conclude that the model is not learning anything useful

## Random Classifier:

Prevalence Classifier

This is the most basic, simple, and wrong case we may use. It simply amounts to label randomly the observations from our set.  We are going to define the function that may do this no matter what values we have in the features.

In this case we expect that all the metrics are around 50%

![fig_17](images/img_017.png)

## Prevalence Classifier:

This is a classifier that just uses the prevalence of one of the labels in the dataset. By choosing the most common label in the dataset we can simply classify every observation as that label.

This classifier will not produce any precision or recall, but the values of specificity and NPV may be better than the random classifier

![fig_18](images/img_018.png)



---



![fig_19](images/img_019.png)

P(BIA) * P(A)

## WHAT IS NAÏVE BAYES?

Naive Bayes is a probabilistic, generative classifier based on Bayes ' formula.  It  models  how  documents  are  generated  by  each  class, rather than directly learning a decision boundary.

Remember that Bayes ' formula measures the impact of the nonindependence  of  two  events.  In  the  NLP  context,  it  relates  the probability of a class given a  document  to  how  likely  that document is under the class and how common the class is, i.e. The posterior  probability  is  proportional  to  the  likelihood  times  the prior.

$$P ( A | B ) = P ( A ) \frac { P ( B | A ) } { P ( B ) }$$

sifier

P(B)

Prevalence Cl

![fig_20](images/img_020.png)

135



---



![fig_21](images/img_021.png)

## BAYES ' C LASSIFIER

In  statistical  decision  theory,  a  supervised  model  is  found  by minimizing the expected prediction error, i.e. the expected value of the loss function. In a binary classifier this loss function will be a (1,0)-matrix, then

$$E P E = E [ L ( y , \hat { y } ( x ) ) ] = \sum _ { x } [ 1 - P ( \hat { y } ( x ) | x ) ]$$

From where we can easily see that the model corresponds to

$$\hat { y } ( x ) = \arg \max ( P ( y | x ) )$$

Which  is interpreted by saying that the assigned label will correspond  to  that  which  maximizes  the  conditional  probability given all the features. This is the Bayes' classifier

![fig_22](images/img_022.png)



---



![fig_23](images/img_023.png)

P(Class | Words)

## NAÏVE BAYES CLASSIFIER

The joint probabilities involved within Bayes ' classifier turn it into a complicated model which can be simplified under the assumption of independence of the features as

$$P \left ( y | \bigcap _ { i } x _ { i } \right ) = P ( y ) \frac { \prod _ { i } P ( x _ { i } | y ) } { P ( x _ { i } ) }$$

And now we have to assume a model for each of the conditional probabilities appearing in the likelihood function.

The assumed probability distribution is what force us (in Python) to use the different functions: GaussianNB, or MultinomialNB, for example. gour o account

offer

SS)

rd

![fig_24](images/img_024.png)



---



le

![fig_25](images/img_025.png)

AI: Natural Language Processing

## NAÏVE BAYES IN NLP

To apply Naive Bayes to text, documents are represented as bags of words, then the word  order is ignored and  each  word contributes independent evidence toward a class.

Hence Naive Bayes assumes that words are conditionally independent  given  the  class.  This  assumption  is  false  in  natural language, but (as said) it greatly simplifies computation and often works well for classification.

Each  class  defines  a  probability  distribution  over  the  vocabulary, and documents are modelled as sequences of word draws, and the features are word counts.

What  the  model  learns  by  the  end  is  which  words  provide evidence for each class which, in turn, makes the model interpretable:  we  can  inspect  which  words  push  a  document toward spam or non-spam

![fig_26](images/img_026.png)



---



le

Log-Probabilities:

## FORMAL TRANSFORMATIONS

log P

![fig_27](images/img_027.png)

## Log-Probabilities:

numerical underflow, making computation stable and efficient.

There are two relevant transformations that may affect the output of our model offer

goura account

Naive Bayes multiplies many small probabilities.

money

Win

## Smoothing:

If a word never appears in the training data for a class, its probability would be zero.

Using  logarithms  turns  products  into  sums  and  avoids numerical  underflow,  making  computation  stable  and efficient.

![fig_28](images/img_028.png)

Smoothing prevents a single unseen word from discarding an entire document. The 'amount' of smoothing is the only hyperparameter of the model

Smoothing:

If a word never apr its probability woul

Smoothing prever

![fig_29](images/img_029.png)



---



![fig_30](images/img_030.png)

## STRENGTHS AND LIMITATIONS

ths P

## The core strengths are

- Naive Bayes is fast, simple, and robust.
- It performs well with small datasets
- It is a strong baseline for many text classification problems.

The main limitations are

- The independence assumption ignores word order and syntax.
- The model does not capture semantic meaning
- Saturates in performance on more complex tasks.

![fig_31](images/img_031.png)



---



## PRACTICE ASSIGNMENT: NAÏVE BAYES CLASSIFIER

SCIENCE &

TECHNOLOGY

![fig_32](images/img_032.png)

We are going to perform a Naïve Bayes Classification on a well-known SMS  dataset to classify the messages in spam/not-spam.

In  the  next  session  we  will  continue  the  activity  using Logistic regression.

![fig_33](images/img_033.png)